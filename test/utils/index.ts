import {Contract} from 'ethers';
import {ethers} from 'hardhat';
import crypto from 'crypto';


export async function setupUsers<T extends {[contractName: string]: Contract}>(
  addresses: string[],
  contracts: T
): Promise<({address: string} & T)[]> {
  const users: ({address: string} & T)[] = [];
  for (const address of addresses) {
    users.push(await setupUser(address, contracts));
  }
  return users;
}

export async function setupUser<T extends {[contractName: string]: Contract}>(
  address: string,
  contracts: T
): Promise<{address: string} & T> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user: any = {address};
  for (const key of Object.keys(contracts)) {
    user[key] = contracts[key].connect(await ethers.getSigner(address));
  }
  return user as {address: string} & T;
}

export async function randomAddress() {
  const id = crypto.randomBytes(32).toString('hex');
  const privateKey = "0x" + id;
  const wallet = new ethers.Wallet(privateKey);
  return wallet.address;
}

export const config = {
    dao: "0x1A621BBd762a52b01c3eF070D3317c8589c37915",//dao multisig address(for now vaultLib as test)
    treasury: "0xc3Ab493d0d06c700d9daF7Ea58aBBe12038ec474",//our dao wallet(for now my main wallet as test)
    tierCeilings: [0],
    fees: [30000]
}
