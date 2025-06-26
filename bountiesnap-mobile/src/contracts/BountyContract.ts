import { Contract, CallData, RpcProvider, Account } from 'starknet'

// Contract address on Sepolia
export const BOUNTY_CONTRACT_ADDRESS = '0x01157909e6562b292ec4c25ac744b6a6c2ad41bbb12c760a93e315ae32ca6b53'

// Sepolia STRK token address
export const STRK_TOKEN_ADDRESS = '0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d'

// Contract ABI based on your Cairo contract
export const BOUNTY_CONTRACT_ABI = [
  {
    type: "impl",
    name: "BountyContractImpl",
    interface_name: "contracts::YourContract::IBountyContract",
  },
  {
    type: "struct",
    name: "core::integer::u256",
    members: [
      {
        name: "low",
        type: "core::integer::u128",
      },
      {
        name: "high",
        type: "core::integer::u128",
      },
    ],
  },
  {
    type: "enum",
    name: "contracts::YourContract::BountyStatus",
    variants: [
      {
        name: "Created",
        type: "()",
      },
      {
        name: "Applied",
        type: "()",
      },
      {
        name: "InProgress",
        type: "()",
      },
      {
        name: "Submitted",
        type: "()",
      },
      {
        name: "Completed",
        type: "()",
      },
      {
        name: "Cancelled",
        type: "()",
      },
    ],
  },
  {
    type: "struct",
    name: "contracts::YourContract::Bounty",
    members: [
      {
        name: "id",
        type: "core::felt252",
      },
      {
        name: "seeker",
        type: "core::starknet::contract_address::ContractAddress",
      },
      {
        name: "hunter",
        type: "core::starknet::contract_address::ContractAddress",
      },
      {
        name: "description",
        type: "core::felt252",
      },
      {
        name: "amount",
        type: "core::integer::u256",
      },
      {
        name: "stake",
        type: "core::integer::u256",
      },
      {
        name: "deadline",
        type: "core::integer::u64",
      },
      {
        name: "status",
        type: "contracts::YourContract::BountyStatus",
      },
      {
        name: "proof",
        type: "core::felt252",
      },
    ],
  },
  {
    type: "interface",
    name: "contracts::YourContract::IBountyContract",
    items: [
      {
        type: "function",
        name: "create_bounty",
        inputs: [
          {
            name: "description",
            type: "core::felt252",
          },
          {
            name: "amount",
            type: "core::integer::u256",
          },
          {
            name: "deadline",
            type: "core::integer::u64",
          },
        ],
        outputs: [
          {
            type: "core::felt252",
          },
        ],
        state_mutability: "external",
      },
      {
        type: "function",
        name: "apply_to_bounty",
        inputs: [
          {
            name: "bounty_id",
            type: "core::felt252",
          },
          {
            name: "stake",
            type: "core::integer::u256",
          },
        ],
        outputs: [],
        state_mutability: "external",
      },
      {
        type: "function",
        name: "approve_hunter",
        inputs: [
          {
            name: "bounty_id",
            type: "core::felt252",
          },
          {
            name: "hunter_address",
            type: "core::starknet::contract_address::ContractAddress",
          },
        ],
        outputs: [],
        state_mutability: "external",
      },
      {
        type: "function",
        name: "submit_completion",
        inputs: [
          {
            name: "bounty_id",
            type: "core::felt252",
          },
          {
            name: "proof",
            type: "core::felt252",
          },
        ],
        outputs: [],
        state_mutability: "external",
      },
      {
        type: "function",
        name: "confirm_completion",
        inputs: [
          {
            name: "bounty_id",
            type: "core::felt252",
          },
        ],
        outputs: [],
        state_mutability: "external",
      },
      {
        type: "function",
        name: "release_funds",
        inputs: [
          {
            name: "bounty_id",
            type: "core::felt252",
          },
        ],
        outputs: [],
        state_mutability: "external",
      },
      {
        type: "function",
        name: "cancel_bounty",
        inputs: [
          {
            name: "bounty_id",
            type: "core::felt252",
          },
        ],
        outputs: [],
        state_mutability: "external",
      },
      {
        type: "function",
        name: "get_bounty",
        inputs: [
          {
            name: "bounty_id",
            type: "core::felt252",
          },
        ],
        outputs: [
          {
            type: "contracts::YourContract::Bounty",
          },
        ],
        state_mutability: "view",
      },
      {
        type: "function",
        name: "get_bounty_status",
        inputs: [
          {
            name: "bounty_id",
            type: "core::felt252",
          },
        ],
        outputs: [
          {
            type: "contracts::YourContract::BountyStatus",
          },
        ],
        state_mutability: "view",
      },
      {
        type: "function",
        name: "is_deadline_passed",
        inputs: [
          {
            name: "bounty_id",
            type: "core::felt252",
          },
        ],
        outputs: [
          {
            type: "core::bool",
          },
        ],
        state_mutability: "view",
      },
      {
        type: "function",
        name: "get_strk_token_address",
        inputs: [],
        outputs: [
          {
            type: "core::starknet::contract_address::ContractAddress",
          },
        ],
        state_mutability: "view",
      },
    ],
  },
] as const

// STRK Token ABI (minimal for approve and transfer functions)
export const STRK_TOKEN_ABI = [
  {
    type: "interface",
    name: "openzeppelin::token::erc20::interface::IERC20",
    items: [
      {
        type: "function",
        name: "approve",
        inputs: [
          {
            name: "spender",
            type: "core::starknet::contract_address::ContractAddress"
          },
          {
            name: "amount",
            type: "core::integer::u256"
          }
        ],
        outputs: [
          {
            type: "core::bool"
          }
        ],
        state_mutability: "external"
      },
      {
        type: "function",
        name: "transfer",
        inputs: [
          {
            name: "recipient",
            type: "core::starknet::contract_address::ContractAddress"
          },
          {
            name: "amount",
            type: "core::integer::u256"
          }
        ],
        outputs: [
          {
            type: "core::bool"
          }
        ],
        state_mutability: "external"
      },
      {
        type: "function",
        name: "balance_of",
        inputs: [
          {
            name: "account",
            type: "core::starknet::contract_address::ContractAddress"
          }
        ],
        outputs: [
          {
            type: "core::integer::u256"
          }
        ],
        state_mutability: "view"
      }
    ]
  }
] as const

// Enum mappings for TypeScript
export enum BountyStatus {
  Created = 0,
  Applied = 1,
  InProgress = 2,
  Submitted = 3,
  Completed = 4,
  Cancelled = 5,
}

// Type definitions
export interface Bounty {
  id: string
  seeker: string
  hunter: string
  description: string
  amount: { low: string; high: string }
  stake: { low: string; high: string }
  deadline: string
  status: BountyStatus
  proof: string
}

export interface CreateBountyParams {
  description: string
  amount: string // Amount in STRK (will be converted to wei)
  deadline: number // Unix timestamp
}

// Provider configuration for Sepolia
export const getProvider = () => {
  return new RpcProvider({
    nodeUrl: 'https://starknet-sepolia.public.blastapi.io',
  })
} 