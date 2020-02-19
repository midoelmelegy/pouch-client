import Pouch from "../contracts/PouchDelegate.json";
// import { PDAI_ADDRESS } from "../constants";
const domainSchema = [
  { name: "name", type: "string" },
  { name: "version", type: "string" },
  { name: "chainId", type: "uint256" },
  { name: "verifyingContract", type: "address" }
];

const depositSchema = [
  { name: "holder", type: "address" },
  { name: "value", type: "uint256" },
  { name: "nonce", type: "uint256" }
];

export default async (web3, signer, CONTRACT_ADDRESS, value) => {
  // const web3 = new Web3(window.web3.currentProvider);
  console.log(CONTRACT_ADDRESS);
  const domainData = {
    name: "Pouch Token",
    version: "1",
    chainId: "42",
    verifyingContract: CONTRACT_ADDRESS
  };
  // const deployedNetwork = Pouch.networks["42"];
  // console.log(deployedNetwork.address);
  const deployedNetwork = Pouch.networks["42"];
  const pouchInstance = new web3.eth.Contract(Pouch.abi, CONTRACT_ADDRESS);
  let nonce = await pouchInstance.methods.nonces(signer).call();
  // console.log(nonce);
  const message = {
    holder: signer,
    value: value,
    nonce: nonce
  };

  let typedData = JSON.stringify({
    types: {
      EIP712Domain: domainSchema,
      Deposit: depositSchema
    },
    primaryType: "Deposit",
    domain: domainData,
    message
  });
  web3.currentProvider.sendAsync(
    {
      method: "eth_signTypedData_v3",
      params: [signer, typedData],
      from: signer
    },
    async function(err, result) {
      if (err) return console.error(err);
      console.log("PERSONAL SIGNED:" + JSON.stringify(result.result));
      const signature = result.result.substring(2);
      const r = "0x" + signature.substring(0, 64);
      const s = "0x" + signature.substring(64, 128);
      const v = parseInt(signature.substring(128, 130), 16);
      // The signature is now comprised of r, s, and v.
      console.log("signature: ", signature);
      console.log("r", r);
      console.log("s", s);
      console.log("v", v);
      await pouchInstance.methods
        .deposit(
          signer,
          value,
          nonce,
          r,
          s,
          v
          // "0x2cf8a1fcb9b15d68b17362da0fad585e8b2be6ab5eda314493686d4b01f2b97d"
        )
        .send({ from: signer, gas: 2000000 });
    }
  );
};
