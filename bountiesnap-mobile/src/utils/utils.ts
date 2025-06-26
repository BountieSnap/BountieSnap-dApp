import { cairo, Uint256 } from "starknet";

export function formatAmount(
  amount: string | number,
  decimals: number = 18
): Uint256 {
  const amountStr = amount.toString();
  const [integerPart, decimalPart = ""] = amountStr.split(".");
  const paddedDecimal = decimalPart.padEnd(decimals, "0").slice(0, decimals);
  const amountBN = BigInt(integerPart + paddedDecimal);

  return cairo.uint256(amountBN);
}

export async function createWallet(network: string = 'sepolia') {
  const apiKey = process.env.EXPO_PUBLIC_CAVOS_API_KEY;
  
  if (!apiKey) {
    throw new Error('CAVOS_API_KEY is not configured');
  }

  const response = await fetch('https://services.cavos.xyz/api/v1/external/deploy', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      network
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error('Wallet creation failed:', errorData);
    throw new Error(`Wallet creation failed: ${response.status}`);
  }

  const data = await response.json();
  return data;
}

export async function callExecuteEndpoint(
  token: string,
  network: string,
  calls: {
    contractAddress: string;
    entrypoint: string;
    calldata: string[];
  }[],
  address: string,
  hashedPk: string
) {
  const body = {
    network,
    calls,
    address,
    hashedPk,
  };
  const res = await fetch('https://services.cavos.xyz/api/v1/external/execute', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    console.log(await res.json());
    throw new Error(`Execute endpoint error: ${res.status}`);
  }
  return res.json();
}

export async function callDeployEndpoint(token: string, network: string) {
  const body = { network };
  const res = await fetch('https://services.cavos.xyz/api/v1/external/deploy', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`Deploy endpoint error: ${res.status}`);
  }
  return res.json();
}