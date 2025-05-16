module milestone_escrow::milestone_escrow {
    use std::error;
    use std::signer;
    use std::string::{Self, String};
    use std::vector;
    
    use aptos_framework::account;
    use aptos_framework::coin::{Self, Coin};
    use aptos_framework::aptos_coin::AptosCoin;
    use aptos_framework::timestamp;
    use aptos_framework::event::{Self, EventHandle};

    // Error codes
    const E_NOT_AUTHORIZED: u64 = 1;
    const E_ESCROW_NOT_EXISTS: u64 = 2;
    const E_ESCROW_ALREADY_EXISTS: u64 = 3;
    const E_MILESTONE_NOT_EXISTS: u64 = 4;
    const E_MILESTONE_ALREADY_COMPLETED: u64 = 5;
    const E_MILESTONE_NOT_COMPLETED: u64 = 6;
    const E_FREELANCER_NOT_ASSIGNED: u64 = 7;
    const E_ESCROW_ALREADY_COMPLETED: u64 = 8;
    const E_INSUFFICIENT_FUNDS: u64 = 9;
    const E_INVALID_STATE: u64 = 10;

    // Escrow status enums
    const ESCROW_STATUS_OPEN: u8 = 0;
    const ESCROW_STATUS_IN_PROGRESS: u8 = 1;
    const ESCROW_STATUS_COMPLETED: u8 = 2;
    const ESCROW_STATUS_CANCELLED: u8 = 3;
    const ESCROW_STATUS_DISPUTED: u8 = 4;

    // Milestone status enums
    const MILESTONE_STATUS_PENDING: u8 = 0;
    const MILESTONE_STATUS_COMPLETED: u8 = 1;
    const MILESTONE_STATUS_PAID: u8 = 2;
    const MILESTONE_STATUS_DISPUTED: u8 = 3;

    // Milestone struct to track each deliverable and its payment
    struct Milestone has store, drop, copy {
        description: String,
        amount: u64,
        deadline: u64,  // Unix timestamp, 0 means no deadline
        status: u8,
    }

    // Main escrow struct
    struct Escrow has key, store {
        client: address,
        freelancer: address,
        title: String,
        description: String,
        milestones: vector<Milestone>,
        total_amount: u64,
        funds: Coin<AptosCoin>,
        status: u8,
        created_at: u64,
        completed_at: u64,  // Will be 0 until completed
    }

    // Events
    struct EscrowCreatedEvent has drop, store {
        escrow_id: u64,
        client: address,
        total_amount: u64,
        milestone_count: u64,
    }

    struct EscrowAcceptedEvent has drop, store {
        escrow_id: u64,
        freelancer: address,
    }

    struct MilestoneCompletedEvent has drop, store {
        escrow_id: u64,
        milestone_index: u64,
        amount: u64,
    }

    struct EscrowCompletedEvent has drop, store {
        escrow_id: u64,
        client: address,
        freelancer: address,
        total_amount: u64,
    }

    struct EscrowCancelledEvent has drop, store {
        escrow_id: u64,
        client: address,
        reason: String,
    }

    struct EscrowDisputedEvent has drop, store {
        escrow_id: u64,
        disputer: address,
        reason: String,
    }

    // Resource to keep track of all escrows and events
    struct EscrowStore has key {
        escrows: vector<Escrow>,
        escrow_created_events: EventHandle<EscrowCreatedEvent>,
        escrow_accepted_events: EventHandle<EscrowAcceptedEvent>,
        milestone_completed_events: EventHandle<MilestoneCompletedEvent>,
        escrow_completed_events: EventHandle<EscrowCompletedEvent>,
        escrow_cancelled_events: EventHandle<EscrowCancelledEvent>,
        escrow_disputed_events: EventHandle<EscrowDisputedEvent>,
    }

    // Initialize module
    fun init_module(account: &signer) {
        if (!exists<EscrowStore>(signer::address_of(account))) {
            move_to(account, EscrowStore {
                escrows: vector::empty<Escrow>(),
                escrow_created_events: account::new_event_handle<EscrowCreatedEvent>(account),
                escrow_accepted_events: account::new_event_handle<EscrowAcceptedEvent>(account),
                milestone_completed_events: account::new_event_handle<MilestoneCompletedEvent>(account),
                escrow_completed_events: account::new_event_handle<EscrowCompletedEvent>(account),
                escrow_cancelled_events: account::new_event_handle<EscrowCancelledEvent>(account),
                escrow_disputed_events: account::new_event_handle<EscrowDisputedEvent>(account),
            });
        }
    }

    // Create a new escrow with multiple milestones
    public entry fun create_escrow(
        client: &signer,
        title: String,
        description: String,
        milestone_descriptions: vector<String>,
        milestone_amounts: vector<u64>,
        milestone_deadlines: vector<u64>
    ) acquires EscrowStore {
        let client_addr = signer::address_of(client);
        
        // Ensure we have the same number of descriptions and amounts
        assert!(
            vector::length(&milestone_descriptions) == vector::length(&milestone_amounts) &&
            vector::length(&milestone_descriptions) == vector::length(&milestone_deadlines),
            error::invalid_argument(E_INVALID_STATE)
        );

        // Create milestones
        let milestones = vector::empty<Milestone>();
        let total_amount: u64 = 0;
        let i = 0;
        let len = vector::length(&milestone_descriptions);
        
        while (i < len) {
            let description = *vector::borrow(&milestone_descriptions, i);
            let amount = *vector::borrow(&milestone_amounts, i);
            let deadline = *vector::borrow(&milestone_deadlines, i);
            
            total_amount = total_amount + amount;
            
            vector::push_back(&mut milestones, Milestone {
                description,
                amount,
                deadline,
                status: MILESTONE_STATUS_PENDING,
            });
            
            i = i + 1;
        };

        // Take payment from client
        let payment = coin::withdraw<AptosCoin>(client, total_amount);

        // Create escrow
        let escrow = Escrow {
            client: client_addr,
            freelancer: @0x0, // Will be set when a freelancer accepts the job
            title,
            description,
            milestones,
            total_amount,
            funds: payment,
            status: ESCROW_STATUS_OPEN,
            created_at: timestamp::now_seconds(),
            completed_at: 0,
        };

        let escrow_store = borrow_global_mut<EscrowStore>(@milestone_escrow);
        let escrow_id = vector::length(&escrow_store.escrows);
        
        vector::push_back(&mut escrow_store.escrows, escrow);
        
        // Emit creation event
        event::emit_event(&mut escrow_store.escrow_created_events, EscrowCreatedEvent {
            escrow_id,
            client: client_addr,
            total_amount,
            milestone_count: len,
        });
    }

    // Accept an escrow as a freelancer
    public entry fun accept_escrow(
        freelancer: &signer,
        escrow_id: u64
    ) acquires EscrowStore {
        let freelancer_addr = signer::address_of(freelancer);
        let escrow_store = borrow_global_mut<EscrowStore>(@milestone_escrow);
        
        // Check that escrow exists
        assert!(escrow_id < vector::length(&escrow_store.escrows), error::not_found(E_ESCROW_NOT_EXISTS));
        
        // Get escrow
        let escrow = vector::borrow_mut(&mut escrow_store.escrows, escrow_id);
        
        // Check escrow is open
        assert!(escrow.status == ESCROW_STATUS_OPEN, error::invalid_state(E_INVALID_STATE));
        
        // Update escrow with freelancer and update status
        escrow.freelancer = freelancer_addr;
        escrow.status = ESCROW_STATUS_IN_PROGRESS;
        
        // Emit event
        event::emit_event(&mut escrow_store.escrow_accepted_events, EscrowAcceptedEvent {
            escrow_id,
            freelancer: freelancer_addr,
        });
    }

    // Complete a milestone - called by client to approve milestone completion
    public entry fun complete_milestone(
        client: &signer,
        escrow_id: u64,
        milestone_index: u64
    ) acquires EscrowStore {
        let client_addr = signer::address_of(client);
        let escrow_store = borrow_global_mut<EscrowStore>(@milestone_escrow);
        
        // Check that escrow exists
        assert!(escrow_id < vector::length(&escrow_store.escrows), error::not_found(E_ESCROW_NOT_EXISTS));
        
        // Get escrow
        let escrow = vector::borrow_mut(&mut escrow_store.escrows, escrow_id);
        
        // Check caller is client
        assert!(escrow.client == client_addr, error::permission_denied(E_NOT_AUTHORIZED));
        
        // Check escrow is in progress
        assert!(escrow.status == ESCROW_STATUS_IN_PROGRESS, error::invalid_state(E_INVALID_STATE));
        
        // Check freelancer has been assigned
        assert!(escrow.freelancer != @0x0, error::invalid_state(E_FREELANCER_NOT_ASSIGNED));
        
        // Check milestone exists
        assert!(milestone_index < vector::length(&escrow.milestones), error::not_found(E_MILESTONE_NOT_EXISTS));
        
        // Get milestone
        let milestone = vector::borrow_mut(&mut escrow.milestones, milestone_index);
        
        // Check milestone is pending
        assert!(milestone.status == MILESTONE_STATUS_PENDING, error::invalid_state(E_MILESTONE_ALREADY_COMPLETED));
        
        // Get amount to pay
        let amount = milestone.amount;
        
        // Update milestone status
        milestone.status = MILESTONE_STATUS_COMPLETED;
        
        // Take coins from escrow funds and send to freelancer
        let payment = coin::extract(&mut escrow.funds, amount);
        let freelancer_addr = escrow.freelancer;
        
        // If this is the last milestone, mark escrow as completed
        let all_complete = true;
        let i = 0;
        let len = vector::length(&escrow.milestones);
        
        while (i < len) {
            let milestone = vector::borrow(&escrow.milestones, i);
            if (milestone.status == MILESTONE_STATUS_PENDING) {
                all_complete = false;
                break
            };
            i = i + 1;
        };
        
        if (all_complete) {
            escrow.status = ESCROW_STATUS_COMPLETED;
            escrow.completed_at = timestamp::now_seconds();
            
            // Emit completion event
            event::emit_event(&mut escrow_store.escrow_completed_events, EscrowCompletedEvent {
                escrow_id,
                client: escrow.client,
                freelancer: escrow.freelancer,
                total_amount: escrow.total_amount,
            });
        };
        
        // Emit milestone completion event
        event::emit_event(&mut escrow_store.milestone_completed_events, MilestoneCompletedEvent {
            escrow_id,
            milestone_index,
            amount,
        });
        
        // Send payment to freelancer
        coin::deposit(freelancer_addr, payment);
        
        // Update milestone status to paid
        let milestone = vector::borrow_mut(&mut escrow.milestones, milestone_index);
        milestone.status = MILESTONE_STATUS_PAID;
    }

    // Cancel an escrow - only callable by client if no freelancer assigned or by mutual agreement
    public entry fun cancel_escrow(
        account: &signer,
        escrow_id: u64,
        reason: String
    ) acquires EscrowStore {
        let account_addr = signer::address_of(account);
        let escrow_store = borrow_global_mut<EscrowStore>(@milestone_escrow);
        
        // Check that escrow exists
        assert!(escrow_id < vector::length(&escrow_store.escrows), error::not_found(E_ESCROW_NOT_EXISTS));
        
        // Get escrow
        let escrow = vector::borrow_mut(&mut escrow_store.escrows, escrow_id);
        
        // Only client can cancel if no freelancer or if escrow is open
        assert!(
            escrow.client == account_addr && (escrow.freelancer == @0x0 || escrow.status == ESCROW_STATUS_OPEN),
            error::permission_denied(E_NOT_AUTHORIZED)
        );
        
        // Update escrow status
        escrow.status = ESCROW_STATUS_CANCELLED;
        
        // Return funds to client
        let client_addr = escrow.client;
        let funds = coin::extract_all(&mut escrow.funds);
        coin::deposit(client_addr, funds);
        
        // Emit cancellation event
        event::emit_event(&mut escrow_store.escrow_cancelled_events, EscrowCancelledEvent {
            escrow_id,
            client: client_addr,
            reason,
        });
    }

    // Create a dispute - can be called by either client or freelancer
    public entry fun create_dispute(
        account: &signer,
        escrow_id: u64,
        reason: String
    ) acquires EscrowStore {
        let account_addr = signer::address_of(account);
        let escrow_store = borrow_global_mut<EscrowStore>(@milestone_escrow);
        
        // Check that escrow exists
        assert!(escrow_id < vector::length(&escrow_store.escrows), error::not_found(E_ESCROW_NOT_EXISTS));
        
        // Get escrow
        let escrow = vector::borrow_mut(&mut escrow_store.escrows, escrow_id);
        
        // Check caller is either client or freelancer
        assert!(
            escrow.client == account_addr || escrow.freelancer == account_addr,
            error::permission_denied(E_NOT_AUTHORIZED)
        );
        
        // Check escrow is in progress
        assert!(escrow.status == ESCROW_STATUS_IN_PROGRESS, error::invalid_state(E_INVALID_STATE));
        
        // Update escrow status
        escrow.status = ESCROW_STATUS_DISPUTED;
        
        // Emit dispute event
        event::emit_event(&mut escrow_store.escrow_disputed_events, EscrowDisputedEvent {
            escrow_id,
            disputer: account_addr,
            reason,
        });
    }

    // Get client escrows
    #[view]
    public fun get_client_escrows(client: address): vector<u64> acquires EscrowStore {
        let escrow_store = borrow_global<EscrowStore>(@milestone_escrow);
        let escrow_ids = vector::empty<u64>();
        let i = 0;
        let len = vector::length(&escrow_store.escrows);
        
        while (i < len) {
            let escrow = vector::borrow(&escrow_store.escrows, i);
            if (escrow.client == client) {
                vector::push_back(&mut escrow_ids, i);
            };
            i = i + 1;
        };
        
        escrow_ids
    }

    // Get freelancer escrows
    #[view]
    public fun get_freelancer_escrows(freelancer: address): vector<u64> acquires EscrowStore {
        let escrow_store = borrow_global<EscrowStore>(@milestone_escrow);
        let escrow_ids = vector::empty<u64>();
        let i = 0;
        let len = vector::length(&escrow_store.escrows);
        
        while (i < len) {
            let escrow = vector::borrow(&escrow_store.escrows, i);
            if (escrow.freelancer == freelancer && escrow.status != ESCROW_STATUS_OPEN) {
                vector::push_back(&mut escrow_ids, i);
            };
            i = i + 1;
        };
        
        escrow_ids
    }

    // Get open escrows
    #[view]
    public fun get_open_escrows(): vector<u64> acquires EscrowStore {
        let escrow_store = borrow_global<EscrowStore>(@milestone_escrow);
        let escrow_ids = vector::empty<u64>();
        let i = 0;
        let len = vector::length(&escrow_store.escrows);
        
        while (i < len) {
            let escrow = vector::borrow(&escrow_store.escrows, i);
            if (escrow.status == ESCROW_STATUS_OPEN) {
                vector::push_back(&mut escrow_ids, i);
            };
            i = i + 1;
        };
        
        escrow_ids
    }

    // Get escrow details
    #[view]
    public fun get_escrow_details(escrow_id: u64): (
        address, // client
        address, // freelancer
        String,  // title
        String,  // description
        u64,     // total_amount
        u8,      // status
        u64,     // created_at
        u64      // completed_at
    ) acquires EscrowStore {
        let escrow_store = borrow_global<EscrowStore>(@milestone_escrow);
        
        // Check that escrow exists
        assert!(escrow_id < vector::length(&escrow_store.escrows), error::not_found(E_ESCROW_NOT_EXISTS));
        
        // Get escrow
        let escrow = vector::borrow(&escrow_store.escrows, escrow_id);
        
        (
            escrow.client,
            escrow.freelancer,
            escrow.title,
            escrow.description,
            escrow.total_amount,
            escrow.status,
            escrow.created_at,
            escrow.completed_at
        )
    }

    // Get milestone details
    #[view]
    public fun get_milestone_details(
        escrow_id: u64,
        milestone_index: u64
    ): (
        String, // description
        u64,    // amount
        u64,    // deadline
        u8      // status
    ) acquires EscrowStore {
        let escrow_store = borrow_global<EscrowStore>(@milestone_escrow);
        
        // Check that escrow exists
        assert!(escrow_id < vector::length(&escrow_store.escrows), error::not_found(E_ESCROW_NOT_EXISTS));
        
        // Get escrow
        let escrow = vector::borrow(&escrow_store.escrows, escrow_id);
        
        // Check milestone exists
        assert!(milestone_index < vector::length(&escrow.milestones), error::not_found(E_MILESTONE_NOT_EXISTS));
        
        // Get milestone
        let milestone = vector::borrow(&escrow.milestones, milestone_index);
        
        (
            milestone.description,
            milestone.amount,
            milestone.deadline,
            milestone.status
        )
    }

    // Get milestone count for an escrow
    #[view]
    public fun get_milestone_count(escrow_id: u64): u64 acquires EscrowStore {
        let escrow_store = borrow_global<EscrowStore>(@milestone_escrow);
        
        // Check that escrow exists
        assert!(escrow_id < vector::length(&escrow_store.escrows), error::not_found(E_ESCROW_NOT_EXISTS));
        
        // Get escrow
        let escrow = vector::borrow(&escrow_store.escrows, escrow_id);
        
        vector::length(&escrow.milestones)
    }
} 