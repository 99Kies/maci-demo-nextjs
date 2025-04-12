export const NETWORK = 'mainnet';

export const DORA_CONFIG = {
	testnet: {
		chainId: 'vota-testnet',
		chainName: 'Dora Vota Testnet',
		rpc: 'https://vota-testnet-rpc.dorafactory.org',
		rest: 'https://vota-testnet-rest.dorafactory.org',
		bip44: {
			coinType: 118,
		},
		bech32Config: {
			bech32PrefixAccAddr: 'dora',
			bech32PrefixAccPub: 'dorapub',
			bech32PrefixValAddr: 'doravaloper',
			bech32PrefixValPub: 'doravaloperpub',
			bech32PrefixConsAddr: 'doravalcons',
			bech32PrefixConsPub: 'doravalconspub',
		},
		currencies: [
			{
				coinDenom: 'DORA',
				coinMinimalDenom: 'peaka',
				coinDecimals: 18,
				coinGeckoId: 'dora',
			},
		],
		feeCurrencies: [
			{
				coinDenom: 'DORA',
				coinMinimalDenom: 'peaka',
				coinDecimals: 18,
				coinGeckoId: 'dora',
				gasPriceStep: {
					low: 100000000000,
					average: 150000000000,
					high: 200000000000,
				},
			},
		],
		stakeCurrency: {
			coinDenom: 'DORA',
			coinMinimalDenom: 'peaka',
			coinDecimals: 18,
			coinGeckoId: 'dora',
		},
		features: [
			// "cosmwasm",
			// "dora-txfees"
		],
	},
	mainnet: {
		chainId: 'vota-ash',
		chainName: 'Dora Vota',
		rpc: 'https://vota-rpc.dorafactory.org',
		rest: 'https://vota-rest.dorafactory.org',
		bip44: {
			coinType: 118,
		},
		bech32Config: {
			bech32PrefixAccAddr: 'dora',
			bech32PrefixAccPub: 'dorapub',
			bech32PrefixValAddr: 'doravaloper',
			bech32PrefixValPub: 'doravaloperpub',
			bech32PrefixConsAddr: 'doravalcons',
			bech32PrefixConsPub: 'doravalconspub',
		},
		currencies: [
			{
				coinDenom: 'DORA',
				coinMinimalDenom: 'peaka',
				coinDecimals: 18,
				coinGeckoId: 'dora',
			},
		],
		feeCurrencies: [
			{
				coinDenom: 'DORA',
				coinMinimalDenom: 'peaka',
				coinDecimals: 18,
				coinGeckoId: 'dora',
				gasPriceStep: {
					low: 100000000000,
					average: 150000000000,
					high: 200000000000,
				},
			},
		],
		stakeCurrency: {
			coinDenom: 'DORA',
			coinMinimalDenom: 'peaka',
			coinDecimals: 18,
			coinGeckoId: 'dora',
		},
		features: [
			// "cosmwasm",
			// "dora-txfees"
		],
	},
};

export const doravota_chain_params = {
	chainId: 'vota-ash',
	chainName: 'Dora Vota',
	rpc: 'https://vota-rpc.dorafactory.org',
	rest: 'https://vota-rest.dorafactory.org',
	bip44: {
		coinType: 118,
	},
	bech32Config: {
		bech32PrefixAccAddr: 'dora',
		bech32PrefixAccPub: 'dorapub',
		bech32PrefixValAddr: 'doravaloper',
		bech32PrefixValPub: 'doravaloperpub',
		bech32PrefixConsAddr: 'doravalcons',
		bech32PrefixConsPub: 'doravalconspub',
	},
	currencies: [
		{
			coinDenom: 'DORA',
			coinMinimalDenom: 'peaka',
			coinDecimals: 18,
			coinGeckoId: 'dora',
		},
	],
	feeCurrencies: [
		{
			coinDenom: 'DORA',
			coinMinimalDenom: 'peaka',
			coinDecimals: 18,
			coinGeckoId: 'dora',
			gasPriceStep: {
				low: 100000000000,
				average: 150000000000,
				high: 200000000000,
			},
		},
	],
	stakeCurrency: {
		coinDenom: 'DORA',
		coinMinimalDenom: 'peaka',
		coinDecimals: 18,
		coinGeckoId: 'dora',
	},
	features: [
		// "cosmwasm",
		// "dora-txfees"
	],
};

const mainnetOraclePubkey =
	'71181283991507933356370686287836778892264767267594565723150933280429059165190';
const testnetOraclePubkey =
	'20569243924629228035563759081356417640308543737009765586195076626319661619637';

export const ORACLE_PUBKEY =
	NETWORK === 'mainnet' ? mainnetOraclePubkey : testnetOraclePubkey;
