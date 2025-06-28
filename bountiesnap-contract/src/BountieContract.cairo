use starknet::ContractAddress;

// Define the contract interface
#[starknet::interface]
pub trait IBountyContract<TContractState> {
    fn create_bounty(
        ref self: TContractState, 
        description: felt252, 
        amount: u256, 
        deadline: u64
    ) -> felt252;
    fn apply_to_bounty(ref self: TContractState, bounty_id: felt252, stake: u256);
    fn approve_hunter(ref self: TContractState, bounty_id: felt252, hunter_address: ContractAddress);
    fn submit_completion(ref self: TContractState, bounty_id: felt252, proof: felt252);
    fn confirm_completion(ref self: TContractState, bounty_id: felt252);
    fn release_funds(ref self: TContractState, bounty_id: felt252);
    fn cancel_bounty(ref self: TContractState, bounty_id: felt252);
    fn get_bounty(self: @TContractState, bounty_id: felt252) -> Bounty;
    fn get_bounty_status(self: @TContractState, bounty_id: felt252) -> BountyStatus;
    fn is_deadline_passed(self: @TContractState, bounty_id: felt252) -> bool;
}

// Bounty status enum
#[derive(Drop, Serde, Copy, starknet::Store, PartialEq)]
#[allow(starknet::store_no_default_variant)]
pub enum BountyStatus {
    Created,
    Applied,
    InProgress,
    Submitted,
    Completed,
    Cancelled,
}

// Bounty struct to store all bounty information
#[derive(Drop, Serde, Copy, starknet::Store)]
pub struct Bounty {
    pub id: felt252,
    pub seeker: ContractAddress,
    pub hunter: ContractAddress,
    pub description: felt252,
    pub amount: u256,
    pub stake: u256,
    pub deadline: u64,
    pub status: BountyStatus,
    pub proof: felt252,
}

// Define the contract module
#[starknet::contract]
pub mod BountyContract {
    use starknet::ContractAddress;
    use starknet::storage::*;
    use starknet::{get_caller_address, get_block_timestamp};
    use super::{Bounty, BountyStatus, IBountyContract};

    // Define storage variables
    #[storage]
    pub struct Storage {
        bounties: Map<felt252, Bounty>,
        bounty_counter: felt252,
        hunter_applications: Map<felt252, ContractAddress>, // bounty_id -> hunter_address
        balances: Map<ContractAddress, u256>, // Track locked funds for each user
    }

    // Define events
    #[event]
    #[derive(Drop, starknet::Event)]
    pub enum Event {
        BountyCreated: BountyCreated,
        HunterApplied: HunterApplied,
        HunterApproved: HunterApproved,
        TaskSubmitted: TaskSubmitted,
        TaskCompleted: TaskCompleted,
        FundsReleased: FundsReleased,
        BountyCancelled: BountyCancelled,
    }

    #[derive(Drop, starknet::Event)]
    pub struct BountyCreated {
        pub bounty_id: felt252,
        pub seeker: ContractAddress,
        pub description: felt252,
        pub amount: u256,
        pub deadline: u64,
    }

    #[derive(Drop, starknet::Event)]
    pub struct HunterApplied {
        pub bounty_id: felt252,
        pub hunter: ContractAddress,
        pub stake: u256,
    }

    #[derive(Drop, starknet::Event)]
    pub struct HunterApproved {
        pub bounty_id: felt252,
        pub hunter: ContractAddress,
    }

    #[derive(Drop, starknet::Event)]
    pub struct TaskSubmitted {
        pub bounty_id: felt252,
        pub hunter: ContractAddress,
        pub proof: felt252,
    }

    #[derive(Drop, starknet::Event)]
    pub struct TaskCompleted {
        pub bounty_id: felt252,
        pub hunter: ContractAddress,
        pub seeker: ContractAddress,
    }

    #[derive(Drop, starknet::Event)]
    pub struct FundsReleased {
        pub bounty_id: felt252,
        pub hunter: ContractAddress,
        pub amount: u256,
        pub stake: u256,
    }

    #[derive(Drop, starknet::Event)]
    pub struct BountyCancelled {
        pub bounty_id: felt252,
        pub seeker: ContractAddress,
        pub reason: felt252,
    }

    // Implement the contract interface
    #[abi(embed_v0)]
    pub impl BountyContractImpl of IBountyContract<ContractState> {
        fn create_bounty(
            ref self: ContractState, 
            description: felt252, 
            amount: u256, 
            deadline: u64
        ) -> felt252 {
            let caller = get_caller_address();
            let current_time = get_block_timestamp();
            
            // Validate inputs
            assert(amount > 0, 'Amount must be greater than 0');
            assert(deadline > current_time, 'Deadline must be in future');
            
            // Generate new bounty ID
            let bounty_id = self.bounty_counter.read() + 1;
            self.bounty_counter.write(bounty_id);
            
            // Create new bounty
            let new_bounty = Bounty {
                id: bounty_id,
                seeker: caller,
                hunter: 0.try_into().unwrap(), // Zero address initially
                description,
                amount,
                stake: 0,
                deadline,
                status: BountyStatus::Created,
                proof: 0,
            };
            
            // Store bounty
            self.bounties.entry(bounty_id).write(new_bounty);
            
            // Lock seeker's funds (simulated - in real implementation would transfer tokens)
            let current_balance = self.balances.entry(caller).read();
            self.balances.entry(caller).write(current_balance + amount);
            
            // Emit event
            self.emit(Event::BountyCreated(BountyCreated {
                bounty_id,
                seeker: caller,
                description,
                amount,
                deadline,
            }));
            
            bounty_id
        }

        fn apply_to_bounty(ref self: ContractState, bounty_id: felt252, stake: u256) {
            let caller = get_caller_address();
            let mut bounty = self.bounties.entry(bounty_id).read();
            
            // Validate bounty exists and is in correct state
            assert(bounty.id != 0, 'Bounty does not exist');
            assert(bounty.status == BountyStatus::Created, 'Bounty not available');
            assert(bounty.seeker != caller, 'Cannot apply to own bounty');
            assert(stake > 0, 'Stake must be greater than 0');
            assert(!self.is_deadline_passed(bounty_id), 'Bounty deadline passed');
            
            // Store hunter application
            self.hunter_applications.entry(bounty_id).write(caller);
            
            // Update bounty status
            bounty.status = BountyStatus::Applied;
            bounty.stake = stake;
            self.bounties.entry(bounty_id).write(bounty);
            
            // Lock hunter's stake (simulated)
            let current_balance = self.balances.entry(caller).read();
            self.balances.entry(caller).write(current_balance + stake);
            
            // Emit event
            self.emit(Event::HunterApplied(HunterApplied {
                bounty_id,
                hunter: caller,
                stake,
            }));
        }

        fn approve_hunter(ref self: ContractState, bounty_id: felt252, hunter_address: ContractAddress) {
            let caller = get_caller_address();
            let mut bounty = self.bounties.entry(bounty_id).read();
            
            // Validate permissions and state
            assert(bounty.id != 0, 'Bounty does not exist');
            assert(bounty.seeker == caller, 'Only seeker can approve');
            assert(bounty.status == BountyStatus::Applied, 'No hunter applied');
            assert(!self.is_deadline_passed(bounty_id), 'Bounty deadline passed');
            
            // Verify the hunter actually applied
            let applied_hunter = self.hunter_applications.entry(bounty_id).read();
            assert(applied_hunter == hunter_address, 'Hunter did not apply');
            
            // Update bounty with approved hunter
            bounty.hunter = hunter_address;
            bounty.status = BountyStatus::InProgress;
            self.bounties.entry(bounty_id).write(bounty);
            
            // Emit event
            self.emit(Event::HunterApproved(HunterApproved {
                bounty_id,
                hunter: hunter_address,
            }));
        }

        fn submit_completion(ref self: ContractState, bounty_id: felt252, proof: felt252) {
            let caller = get_caller_address();
            let mut bounty = self.bounties.entry(bounty_id).read();
            
            // Validate permissions and state
            assert(bounty.id != 0, 'Bounty does not exist');
            assert(bounty.hunter == caller, 'Only assigned hunter');
            assert(bounty.status == BountyStatus::InProgress, 'Bounty not in progress');
            assert(!self.is_deadline_passed(bounty_id), 'Bounty deadline passed');
            
            // Update bounty with proof
            bounty.proof = proof;
            bounty.status = BountyStatus::Submitted;
            self.bounties.entry(bounty_id).write(bounty);
            
            // Emit event
            self.emit(Event::TaskSubmitted(TaskSubmitted {
                bounty_id,
                hunter: caller,
                proof,
            }));
        }

        fn confirm_completion(ref self: ContractState, bounty_id: felt252) {
            let caller = get_caller_address();
            let mut bounty = self.bounties.entry(bounty_id).read();
            
            // Validate permissions and state
            assert(bounty.id != 0, 'Bounty does not exist');
            assert(bounty.seeker == caller, 'Only seeker can confirm');
            assert(bounty.status == BountyStatus::Submitted, 'Task not submitted');
            
            // Update bounty status
            bounty.status = BountyStatus::Completed;
            self.bounties.entry(bounty_id).write(bounty);
            
            // Emit event
            self.emit(Event::TaskCompleted(TaskCompleted {
                bounty_id,
                hunter: bounty.hunter,
                seeker: bounty.seeker,
            }));
        }

        fn release_funds(ref self: ContractState, bounty_id: felt252) {
            let bounty = self.bounties.entry(bounty_id).read();
            
            // Validate bounty state
            assert(bounty.id != 0, 'Bounty does not exist');
            assert(bounty.status == BountyStatus::Completed, 'Task not completed');
            
            // Release funds: bounty amount to hunter, stake back to hunter
            let seeker_balance = self.balances.entry(bounty.seeker).read();
            let hunter_balance = self.balances.entry(bounty.hunter).read();
            
            // Update balances (simulated transfer)
            assert(seeker_balance >= bounty.amount, 'Insufficient seeker balance');
            assert(hunter_balance >= bounty.stake, 'Insufficient hunter balance');
            
            self.balances.entry(bounty.seeker).write(seeker_balance - bounty.amount);
            self.balances.entry(bounty.hunter).write(hunter_balance - bounty.stake + bounty.amount);
            
            // Emit event
            self.emit(Event::FundsReleased(FundsReleased {
                bounty_id,
                hunter: bounty.hunter,
                amount: bounty.amount,
                stake: bounty.stake,
            }));
        }

        fn cancel_bounty(ref self: ContractState, bounty_id: felt252) {
            let caller = get_caller_address();
            let mut bounty = self.bounties.entry(bounty_id).read();
            
            // Validate permissions and state
            assert(bounty.id != 0, 'Bounty does not exist');
            assert(bounty.seeker == caller, 'Only seeker can cancel');
            assert(
                bounty.status == BountyStatus::Created || 
                bounty.status == BountyStatus::Applied ||
                self.is_deadline_passed(bounty_id), 
                'Cannot cancel at this stage'
            );
            
            // Update bounty status
            bounty.status = BountyStatus::Cancelled;
            self.bounties.entry(bounty_id).write(bounty);
            
            // Refund seeker's amount
            let seeker_balance = self.balances.entry(bounty.seeker).read();
            assert(seeker_balance >= bounty.amount, 'Insufficient balance');
            self.balances.entry(bounty.seeker).write(seeker_balance - bounty.amount);
            
            // Refund hunter's stake if applied
            if bounty.status == BountyStatus::Applied && bounty.stake > 0 {
                let hunter = self.hunter_applications.entry(bounty_id).read();
                let hunter_balance = self.balances.entry(hunter).read();
                assert(hunter_balance >= bounty.stake, 'Insufficient hunter balance');
                self.balances.entry(hunter).write(hunter_balance - bounty.stake);
            }
            
            // Emit event
            self.emit(Event::BountyCancelled(BountyCancelled {
                bounty_id,
                seeker: bounty.seeker,
                reason: 'Cancelled by seeker',
            }));
        }

        fn get_bounty(self: @ContractState, bounty_id: felt252) -> Bounty {
            self.bounties.entry(bounty_id).read()
        }

        fn get_bounty_status(self: @ContractState, bounty_id: felt252) -> BountyStatus {
            let bounty = self.bounties.entry(bounty_id).read();
            bounty.status
        }

        fn is_deadline_passed(self: @ContractState, bounty_id: felt252) -> bool {
            let bounty = self.bounties.entry(bounty_id).read();
            let current_time = get_block_timestamp();
            current_time > bounty.deadline
        }
    }
}

#[cfg(test)]
mod tests {
    use super::{BountyContract, IBountyContractDispatcher, IBountyContractDispatcherTrait, BountyStatus};
    use starknet::{ContractAddress, contract_address_const, get_block_timestamp};
    use snforge_std::{declare, ContractClassTrait, DeclareResultTrait};

    fn deploy_contract() -> IBountyContractDispatcher {
        let contract = declare("BountyContract").unwrap().contract_class();
        let (contract_address, _) = contract.deploy(@ArrayTrait::new()).unwrap();
        IBountyContractDispatcher { contract_address }
    }

    #[test]
    fn test_create_bounty() {
        let contract = deploy_contract();
        let description = 'Test bounty description';
        let amount = 1000;
        let deadline = get_block_timestamp() + 86400; // 1 day from now
        
        let bounty_id = contract.create_bounty(description, amount, deadline);
        
        assert(bounty_id == 1, 'Bounty ID should be 1');
        
        let bounty = contract.get_bounty(bounty_id);
        assert(bounty.description == description, 'Description mismatch');
        assert(bounty.amount == amount, 'Amount mismatch');
        assert(bounty.status == BountyStatus::Created, 'Status should be Created');
    }

    #[test]
    fn test_bounty_lifecycle() {
        let contract = deploy_contract();
        let seeker = contract_address_const::<0x123>();
        let hunter = contract_address_const::<0x456>();
        
        // Create bounty
        let description = 'Test bounty';
        let amount = 1000;
        let deadline = get_block_timestamp() + 86400;
        let bounty_id = contract.create_bounty(description, amount, deadline);
        
        // Check initial status
        assert(contract.get_bounty_status(bounty_id) == BountyStatus::Created, 'Should be Created');
        
        // Note: Full lifecycle testing would require proper test setup with multiple accounts
        // This is a basic structure for testing the core functionality
    }
}
