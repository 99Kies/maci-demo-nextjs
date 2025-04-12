'use client';

import { DORA_CONFIG, NETWORK, ORACLE_PUBKEY } from './const';
import { MaciClient, MaciCircuitType, genKeypair } from '@dorafactory/maci-sdk';
import { OfflineSigner } from '@cosmjs/proto-signing';
import { useState } from 'react';
import { toast } from 'sonner';

export default function Home() {
  const [roundAddress, setRoundAddress] = useState<string>('');
  const [signerInfo, setSignerInfo] = useState<{
    signer: OfflineSigner | null;
    address: string | null;
  }>({ signer: null, address: null });
  const [maciKeypair, setMaciKeypair] = useState<any>(null);
  const [maciClient, setMaciClient] = useState<MaciClient | null>(null);
  const [loading, setLoading] = useState<{
    deploy: boolean;
    signup: boolean;
    vote: boolean;
  }>({
    deploy: false,
    signup: false,
    vote: false
  });
  const [txResults, setTxResults] = useState<{
    deploy: string;
    signup: string;
    vote: string;
  }>({
    deploy: '',
    signup: '',
    vote: ''
  });

  const getExplorerUrl = (txHash: string) => {
    const baseUrl =
      NETWORK === 'mainnet'
        ? 'https://vota-explorer.dorafactory.org/doravota/tx/'
        : 'https://vota-testnet-explorer.dorafactory.org/doravotatestnet/tx/';
    return `${baseUrl}${txHash}`;
  };

  async function getKeplrSigner(): Promise<{
    signer: OfflineSigner | null;
    address: string | null;
  }> {
    try {
      const chainId = DORA_CONFIG[NETWORK].chainId;
      await (window as any).keplr.experimentalSuggestChain(DORA_CONFIG[NETWORK]);

      await (window as any).keplr.enable(chainId);
      const offlineSigner = (window as any).getOfflineSigner(chainId);

      let address = await offlineSigner.getAccounts();
      if (address.length === 0) return { signer: null, address: null };
      const result = {
        signer: offlineSigner,
        address: address[0].address
      };
      setSignerInfo(result);
      console.log(signerInfo);
      return result;
    } catch (err) {
      console.error('getKeplrSigner error:', err);
      return { signer: null, address: null };
    }
  }

  async function getMaciClient() {
    const { signer } = await getKeplrSigner();
    if (!signer) return false;
    console.log('maciKeypair', maciKeypair);
    const client = new MaciClient({
      network: NETWORK,
      signer,
      maciKeypair
    });
    setMaciClient(client);
    return client;
  }

  async function generateMaciKeypair() {
    const { signer, address } = await getKeplrSigner();
    if (!signer || !address) return false;

    const sig = await signMessage(address, 'Generate_MACI_Private_Key');

    const sign = BigInt('0x' + Buffer.from(sig.signature, 'base64').toString('hex'));

    const keypair = genKeypair(sign);
    setMaciKeypair(keypair);
    return keypair;
  }

  async function signMessage(
    address: string,
    message: string
  ): Promise<{
    signature: string;
    pubkey: Uint8Array;
  }> {
    const sig = await (window as any).keplr.signArbitrary(
      DORA_CONFIG[NETWORK].chainId,
      address,
      message
    );

    return {
      signature: sig.signature,
      pubkey: sig.pub_key.value
    };
  }

  async function deployRound() {
    try {
      setLoading((prev) => ({ ...prev, deploy: true }));
      const client = await getMaciClient();
      if (!client) return false;

      const newRound = await client.createOracleMaciRound({
        operatorPubkey: ORACLE_PUBKEY,
        startVoting: new Date(new Date().getTime()),
        endVoting: new Date(new Date().getTime() + 5 * 60 * 1000),
        title: 'new oracle maci round',
        voteOptionMap: ['option1: A', 'option2: B', 'option3: C'],
        circuitType: MaciCircuitType.IP1V,
        whitelistEcosystem: 'doravota',
        whitelistSnapshotHeight: '0',
        whitelistVotingPowerArgs: {
          mode: 'slope',
          slope: '1000000',
          threshold: '1000000'
        }
      });
      console.log('newRound:', newRound);
      setRoundAddress(newRound.contractAddress);
      setTxResults((prev) => ({
        ...prev,
        deploy: newRound.transactionHash
      }));
      toast.success('Deployment successful!', {
        action: {
          label: 'View Transaction',
          onClick: () => window.open(getExplorerUrl(newRound.transactionHash), '_blank')
        }
      });
      return newRound.contractAddress;
    } catch (error) {
      console.error('Deploy error:', error);
      toast.error('Deployment failed: ' + (error as Error).message);
    } finally {
      setLoading((prev) => ({ ...prev, deploy: false }));
    }
  }

  async function signup() {
    try {
      setLoading((prev) => ({ ...prev, signup: true }));
      const client = await getMaciClient();
      if (!client || !maciKeypair) return false;

      const address = await client.getAddress();
      const certificate = await client.requestOracleCertificate({
        ecosystem: 'doravota',
        address,
        contractAddress: roundAddress
      });
      console.log('certificate', certificate);

      let hasFeegrant = await client.hasFeegrant({
        address,
        contractAddress: roundAddress
      });
      console.log('hasFeegrant', hasFeegrant);

      while (!hasFeegrant) {
        hasFeegrant = await client.hasFeegrant({
          address,
          contractAddress: roundAddress
        });
        console.log('checking hasFeegrant:', hasFeegrant);
      }

      const signupResponse = await client.signup({
        address,
        contractAddress: roundAddress,
        maciKeypair,
        oracleCertificate: {
          amount: certificate.amount,
          signature: certificate.signature
        },
        gasStation: false
      });

      console.log('signup tx:', signupResponse.transactionHash);
      setTxResults((prev) => ({
        ...prev,
        signup: signupResponse.transactionHash
      }));
      toast.success('Registration successful!', {
        action: {
          label: 'View Transaction',
          onClick: () => window.open(getExplorerUrl(signupResponse.transactionHash), '_blank')
        }
      });
    } catch (error) {
      console.error('Signup error:', error);
      toast.error('Registration failed: ' + (error as Error).message);
    } finally {
      setLoading((prev) => ({ ...prev, signup: false }));
    }
  }

  async function vote() {
    try {
      setLoading((prev) => ({ ...prev, vote: true }));
      const client = await getMaciClient();
      if (!client || !maciKeypair) return false;
      const roundInfo = await client.getRoundInfo({
        contractAddress: roundAddress
      });

      const address = await client.getAddress();
      const stateIdx = await client.getStateIdxByPubKey({
        contractAddress: roundAddress,
        pubKey: maciKeypair.pubKey
      });
      console.log('stateIdx', stateIdx);

      const voteResponse = await client.vote({
        address,
        stateIdx,
        contractAddress: roundAddress,
        selectedOptions: [
          { idx: 0, vc: 1 },
          { idx: 1, vc: 1 }
        ],
        operatorCoordPubKey: [
          BigInt(roundInfo.coordinatorPubkeyX),
          BigInt(roundInfo.coordinatorPubkeyY)
        ],
        maciKeypair,
        gasStation: false
      });

      console.log('vote tx:', voteResponse.transactionHash);
      setTxResults((prev) => ({
        ...prev,
        vote: voteResponse.transactionHash
      }));
      toast.success('Vote successful!', {
        action: {
          label: 'View Transaction',
          onClick: () => window.open(getExplorerUrl(voteResponse.transactionHash), '_blank')
        }
      });
    } catch (error) {
      console.error('Vote error:', error);
      toast.error('Vote failed: ' + (error as Error).message);
    } finally {
      setLoading((prev) => ({ ...prev, vote: false }));
    }
  }

  return (
    <div className="min-h-screen p-8 bg-black text-white">
      <main className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">MACI Demo</h1>

        {/* Status Display */}
        <div className="mb-8 p-4 bg-gray-800 rounded border border-gray-700">
          <h2 className="text-xl font-semibold mb-4">Current Status</h2>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <p className="text-gray-200">
                Signer:{' '}
                <span className="text-blue-400">
                  {signerInfo.address ? `Connected: ${signerInfo.address}` : 'Not Connected'}
                </span>
              </p>
              <p className="text-gray-200">
                MACI Keypair:{' '}
                <span className="text-blue-400">
                  {maciKeypair
                    ? `Generated: ${maciKeypair.pubKey[0]}
                    ${maciKeypair.pubKey[1]}`
                    : 'Not Generated'}
                </span>
              </p>
              <p className="text-gray-200">
                MACI Client:{' '}
                <span className="text-blue-400">
                  {maciClient ? `Created: ${maciClient.packMaciPubkey()}` : 'Not Created'}
                </span>
              </p>
              <p className="text-gray-200">
                Round Address:{' '}
                <span className="text-blue-400">{roundAddress || 'Not Deployed'}</span>
              </p>
            </div>
            {/* Transaction Results Display */}
            <div className="mt-4">
              {txResults.deploy && (
                <p className="text-gray-200">
                  Deploy Transaction:{' '}
                  <a
                    href={getExplorerUrl(txResults.deploy)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline"
                  >
                    {txResults.deploy.slice(0, 10)}...
                  </a>
                </p>
              )}
              {txResults.signup && (
                <p className="text-gray-200">
                  Registration Transaction:{' '}
                  <a
                    href={getExplorerUrl(txResults.signup)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline"
                  >
                    {txResults.signup.slice(0, 10)}...
                  </a>
                </p>
              )}
              {txResults.vote && (
                <p className="text-gray-200">
                  Vote Transaction:{' '}
                  <a
                    href={getExplorerUrl(txResults.vote)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline"
                  >
                    {txResults.vote.slice(0, 10)}...
                  </a>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Basic Operations */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Basic Operations</h2>
          <div className="flex gap-4">
            <div className="relative">
              <div className="absolute -top-3 -left-3 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-sm font-bold">
                1
              </div>
              <button
                onClick={getKeplrSigner}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Connect Keplr
              </button>
            </div>
            <div className="relative">
              <div className="absolute -top-3 -left-3 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-sm font-bold">
                2
              </div>
              <button
                onClick={generateMaciKeypair}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Generate MACI Keypair
              </button>
            </div>
            <div className="relative">
              <div className="absolute -top-3 -left-3 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-sm font-bold">
                3
              </div>
              <button
                onClick={getMaciClient}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Create MACI Client
              </button>
            </div>
          </div>
        </div>

        {/* MACI Operations */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">MACI Operations</h2>
          <div className="flex gap-4">
            <div className="relative">
              <div className="absolute -top-3 -left-3 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-sm font-bold">
                4
              </div>
              <button
                onClick={deployRound}
                disabled={loading.deploy}
                className={`px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center gap-2 ${
                  loading.deploy ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {loading.deploy ? (
                  <>
                    <span className="animate-spin">⭕</span>
                    Deploying...
                  </>
                ) : (
                  'Deploy Voting Round'
                )}
              </button>
            </div>
            <div className="relative">
              <div className="absolute -top-3 -left-3 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-sm font-bold">
                5
              </div>
              <button
                onClick={signup}
                disabled={loading.signup}
                className={`px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center gap-2 ${
                  loading.signup ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {loading.signup ? (
                  <>
                    <span className="animate-spin">⭕</span>
                    Registering...
                  </>
                ) : (
                  'Register Vote'
                )}
              </button>
            </div>
            <div className="relative">
              <div className="absolute -top-3 -left-3 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-sm font-bold">
                6
              </div>
              <button
                onClick={vote}
                disabled={loading.vote}
                className={`px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center gap-2 ${
                  loading.vote ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {loading.vote ? (
                  <>
                    <span className="animate-spin">⭕</span>
                    Voting...
                  </>
                ) : (
                  'Vote(Option 1: one vote, Option 2: one vote)'
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 p-4 bg-gray-800 rounded border border-gray-700">
          <h2 className="text-xl font-semibold mb-4">Operation Instructions</h2>
          <ol className="list-decimal pl-4 space-y-2 text-gray-200">
            <li>First connect Keplr wallet</li>
            <li>Generate MACI Keypair for voting</li>
            <li>Create MACI Client for contract interaction</li>
            <li>Deploy new voting round (requires signer)</li>
            <li>Register to vote (requires MACI Keypair and signer)</li>
            <li>Cast your vote (requires MACI Keypair and signer)</li>
          </ol>
        </div>
      </main>
    </div>
  );
}
