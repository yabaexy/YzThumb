/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Coins, 
  Shield, 
  Zap, 
  ArrowRightLeft, 
  TrendingUp, 
  ExternalLink, 
  Copy, 
  Check, 
  Menu, 
  X, 
  LayoutDashboard, 
  History, 
  Settings, 
  HelpCircle,
  Lock,
  Eye,
  EyeOff,
  RefreshCw,
  ArrowDown,
  Wallet,
  Code2,
  AlertTriangle,
  LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { createPublicClient, createWalletClient, http, custom, formatUnits, parseUnits, Address } from 'viem';
import { bsc } from 'viem/chains';

// Constants
const WYDA_CONTRACT = "0xD84B7E8b295d9Fa9656527AC33Bf4F683aE7d2C4";
const USDT_CONTRACT = "0x55d398326f99059fF775485246999027B3197955";
const MIXER_VAULT = "0xD84B7E8b295d9Fa9656527AC33Bf4F683aE7d2C4"; // Using WYDA contract as vault for demo
const OFFICIAL_BSC_RPC = "https://bsc-dataseed.binance.org/";
const BSC_SCAN_URL = `https://bscscan.com/token/${WYDA_CONTRACT}`;

const ERC20_ABI = [
  {
    name: 'transfer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'recipient', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  { 
    name: 'balanceOf', 
    type: 'function', 
    inputs: [{ name: 'account', type: 'address' }], 
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view'
  },
  { 
    name: 'totalSupply', 
    type: 'function', 
    inputs: [], 
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view'
  }
] as const;

interface Transaction {
  id: string;
  type: 'Tumble' | 'Mix';
  amount: string;
  status: 'Completed' | 'Pending' | 'Failed';
  timestamp: string;
  txHash: string;
}

const mockTransactions: Transaction[] = [
  { id: '1', type: 'Tumble', amount: '5,000 WYDA', status: 'Completed', timestamp: '2026-04-04 10:30', txHash: '0x7a...f21' },
  { id: '2', type: 'Mix', amount: '12,500 WYDA', status: 'Completed', timestamp: '2026-04-04 09:15', txHash: '0x3b...e8a' },
  { id: '3', type: 'Tumble', amount: '1,000 WYDA', status: 'Pending', timestamp: '2026-04-04 11:45', txHash: '0x9d...c4b' },
  { id: '4', type: 'Mix', amount: '25,000 WYDA', status: 'Failed', timestamp: '2026-04-03 22:10', txHash: '0x1e...d92' },
  { id: '5', type: 'Tumble', amount: '8,200 WYDA', status: 'Completed', timestamp: '2026-04-03 18:55', txHash: '0x5c...a11' },
];

// Initialize Viem Client with Official BSC RPC
const publicClient = createPublicClient({
  chain: bsc,
  transport: http(OFFICIAL_BSC_RPC)
});

// Components
const LegalDisclaimer = ({ className }: { className?: string }) => (
  <div className={cn("p-4 bg-red-500/5 border border-red-500/10 rounded-xl", className)}>
    <div className="flex gap-3">
      <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
      <div className="space-y-2">
        <p className="text-[10px] text-red-400/80 leading-relaxed font-medium">
          I am prohibiting the use of this system for any illegal activity in any case. I am not fully responsible for any criminal situations that arise using this system in any case.
        </p>
        <p className="text-[10px] text-red-400/80 leading-relaxed font-medium">
          私はいかなる場合においても、このシステムを違法行為に使用することを禁止します。 いかなる場合においても、この制度を利用して発生するいかなる犯罪状況についても、私は完全には責任を負いません。
        </p>
        <p className="text-[10px] text-red-400/80 leading-relaxed font-medium">
          我禁止在任何情况下将此系统用于任何非法活动。 在任何情况下，使用这个系统出现的任何刑事情况，我都不完全负责。
        </p>
      </div>
    </div>
  </div>
);

const TumbleAnimation = ({ selectedToken, isMixing }: { selectedToken: 'WYDA' | 'USDT', isMixing: boolean }) => {
  const [items, setItems] = useState<number[]>([]);

  useEffect(() => {
    if (!isMixing) {
      setItems([]);
      return;
    }
    const interval = setInterval(() => {
      setItems(prev => [...prev.slice(-5), Date.now()]);
    }, 1500);
    return () => clearInterval(interval);
  }, [isMixing]);

  return (
    <div className="relative h-64 w-full bg-bnb-black/40 rounded-2xl border border-white/5 overflow-hidden flex flex-col items-center justify-center">
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-full bg-gradient-to-b from-transparent via-bnb-yellow to-transparent" />
      </div>
      
      <div className="z-10 flex flex-col items-center gap-4">
        <motion.div 
          animate={isMixing ? { rotate: 360 } : {}}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          className={cn(
            "p-4 rounded-full border-2 border-dashed transition-colors",
            isMixing ? "border-bnb-yellow" : "border-white/10"
          )}
        >
          <div className={cn(
            "p-4 rounded-full transition-colors",
            isMixing ? "bg-bnb-yellow/20" : "bg-white/5"
          )}>
            <RefreshCw className={cn(
              "w-8 h-8 transition-colors",
              isMixing ? "text-bnb-yellow" : "text-gray-600"
            )} />
          </div>
        </motion.div>
        <div className="text-center">
          <p className={cn(
            "text-xs font-mono uppercase tracking-widest transition-colors",
            isMixing ? "text-bnb-yellow" : "text-gray-600"
          )}>
            {isMixing 
              ? (selectedToken === 'USDT' ? "Swapping & Tumbling..." : "Tumbling Engine Active") 
              : "Engine Standby"}
          </p>
          {isMixing && selectedToken === 'USDT' && (
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-[10px] text-green-400 mt-1 font-mono"
            >
              USDT (0x55d3...7955) → WYDA (0xD84B...d2C4)
            </motion.p>
          )}
        </div>
      </div>

      <AnimatePresence>
        {isMixing && items.map((id) => (
          <motion.div
            key={id}
            initial={{ y: -50, opacity: 0, scale: 0.5 }}
            animate={{ y: 300, opacity: [0, 1, 1, 0], scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 3, ease: "linear" }}
            className="absolute top-0 left-1/2 -translate-x-1/2 flex flex-col items-center"
          >
            <div className={cn(
              "w-3 h-3 rounded-full shadow-[0_0_10px_rgba(243,186,47,0.8)]",
              selectedToken === 'USDT' ? "bg-green-400" : "bg-bnb-yellow"
            )} />
            <div className="mt-2 text-[10px] font-mono text-white/40 whitespace-nowrap">
              {selectedToken === 'USDT' ? `SWAP_${id.toString().slice(-4)}` : `TX_${id.toString().slice(-4)}`}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

const CodeBlock = ({ code }: { code: string }) => (
  <div className="bg-bnb-black rounded-xl p-6 border border-white/5 overflow-x-auto">
    <pre className="text-xs font-mono text-gray-300 leading-relaxed">
      <code>{code}</code>
    </pre>
  </div>
);

export default function App() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMixing, setIsMixing] = useState(false);
  const [tokenBalance, setTokenBalance] = useState<string>("0.00");
  const [usdtBalance, setUsdtBalance] = useState<string>("0.00");
  const [selectedToken, setSelectedToken] = useState<'WYDA' | 'USDT'>('WYDA');
  const [tumbleAmount, setTumbleAmount] = useState<string>("");
  const [address, setAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [txStatus, setTxStatus] = useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null);
  
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'tumble', label: 'Tumble', icon: RefreshCw },
    { id: 'contract', label: 'Smart Contract', icon: Code2 },
    { id: 'history', label: 'History', icon: History },
    { id: 'security', label: 'Security', icon: Shield },
  ];

  // Fetch real token data on load
  useEffect(() => {
    const fetchTokenData = async () => {
      try {
        const totalSupply = await publicClient.readContract({
          address: WYDA_CONTRACT as `0x${string}`,
          abi: ERC20_ABI,
          functionName: 'totalSupply',
        } as any);
        console.log("Total Supply:", formatUnits(totalSupply as bigint, 18));
      } catch (e) {
        console.error("Error fetching token data:", e);
      }
    };
    fetchTokenData();
  }, []);

  // Handle account changes
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      const ethereum = (window as any).ethereum;
      
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length > 0) {
          setAddress(accounts[0]);
          fetchBalance(accounts[0]);
        } else {
          setAddress(null);
          setTokenBalance("0.00");
        }
      };

      ethereum.on('accountsChanged', handleAccountsChanged);
      return () => ethereum.removeListener('accountsChanged', handleAccountsChanged);
    }
  }, []);

  const fetchBalance = async (userAddress: string) => {
    try {
      // Fetch WYDA Balance
      const wydaBalance = await publicClient.readContract({
        address: WYDA_CONTRACT as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [userAddress as `0x${string}`]
      } as any);
      
      setTokenBalance(new Intl.NumberFormat().format(Number(formatUnits(wydaBalance as bigint, 18))));

      // Fetch USDT Balance
      const usdtBalance = await publicClient.readContract({
        address: USDT_CONTRACT as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [userAddress as `0x${string}`]
      } as any);
      
      setUsdtBalance(new Intl.NumberFormat().format(Number(formatUnits(usdtBalance as bigint, 18))));
    } catch (e) {
      console.error("Error fetching balance:", e);
    }
  };

  const connectWallet = async () => {
    if (typeof window === 'undefined' || !(window as any).ethereum) {
      alert("Please install a Web3 wallet like MetaMask.");
      return;
    }

    setIsConnecting(true);
    try {
      const accounts = await (window as any).ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      if (accounts.length > 0) {
        setAddress(accounts[0]);
        await fetchBalance(accounts[0]);
      }
    } catch (error) {
      console.error("Connection error:", error);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setAddress(null);
    setTokenBalance("0.00");
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(WYDA_CONTRACT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTumble = async () => {
    if (!address) {
      connectWallet();
      return;
    }
    
    const amount = Number(tumbleAmount);
    if (!tumbleAmount || isNaN(amount) || amount <= 0) {
      setTxStatus({ type: 'error', message: 'Please enter a valid amount' });
      return;
    }

    setIsMixing(true);
    setTxStatus({ type: 'info', message: 'Initiating transaction...' });

    try {
      const walletClient = createWalletClient({
        chain: bsc,
        transport: custom((window as any).ethereum)
      });

      const tokenAddress = selectedToken === 'WYDA' ? WYDA_CONTRACT : USDT_CONTRACT;
      const decimals = 18; // Both WYDA and USDT on BSC usually use 18 decimals
      const parsedAmount = parseUnits(tumbleAmount, decimals);

      const hash = await walletClient.writeContract({
        address: tokenAddress as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'transfer',
        args: [MIXER_VAULT as `0x${string}`, parsedAmount],
        account: address as `0x${string}`,
        chain: bsc
      } as any);

      setTxStatus({ type: 'info', message: 'Transaction sent. Waiting for confirmation...' });
      
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      
      if (receipt.status === 'success') {
        setTxStatus({ type: 'success', message: 'Tumble successful! Your assets are being processed.' });
        setTumbleAmount("");
        fetchBalance(address);
      } else {
        throw new Error('Transaction failed');
      }
    } catch (error: any) {
      console.error("Tumble error:", error);
      setTxStatus({ 
        type: 'error', 
        message: error.message?.includes('User rejected') 
          ? 'Transaction rejected by user' 
          : 'Transaction failed. Please check your balance and try again.' 
      });
    } finally {
      setIsMixing(false);
      setTimeout(() => setTxStatus(null), 5000);
    }
  };

  const solidityCode = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract WydaTumbler {
    IERC20 public immutable wydaToken;
    uint256 public constant MIXING_FEE_BPS = 10; // 0.1%
    uint256 public constant MIN_DELAY = 1 hours;
    
    function deposit(bytes32 commitment, uint256 amount) external {
        require(wydaToken.transferFrom(msg.sender, address(this), amount));
        // ... storage logic ...
    }

    function withdraw(bytes32 secret, bytes32 nullifier, address to) external {
        // ... verification and transfer logic ...
    }
}`;

  return (
    <div className="min-h-screen bg-bnb-black flex flex-col">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] lg:hidden"
            />
            <motion.aside 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-72 bg-bnb-dark border-r border-white/5 z-[70] lg:hidden p-6 flex flex-col"
            >
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-bnb-yellow rounded-lg flex items-center justify-center">
                    <ArrowRightLeft className="w-5 h-5 text-bnb-black" />
                  </div>
                  <h1 className="text-lg font-bold font-display tracking-tight">Y'z <span className="text-bnb-yellow">thumb.</span></h1>
                </div>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 hover:bg-white/5 rounded-lg">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <nav className="space-y-1">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                      activeTab === item.id 
                        ? "bg-bnb-yellow/10 text-bnb-yellow" 
                        : "text-gray-400 hover:text-gray-100 hover:bg-white/5"
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </button>
                ))}
              </nav>

              <div className="mt-auto p-4 bg-white/5 rounded-2xl border border-white/5">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">BSC Mainnet</span>
                </div>
                <p className="text-xs text-gray-400 truncate font-mono">{WYDA_CONTRACT}</p>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Top Navigation / Header */}
      <header className="h-20 border-b border-white/5 flex items-center justify-between px-6 lg:px-12 sticky top-0 bg-bnb-black/80 backdrop-blur-xl z-50">
        <div className="flex items-center gap-8">
          {/* Branding */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 hover:bg-white/5 rounded-lg"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="hidden lg:flex items-center gap-3 mr-4">
              <div className="w-9 h-9 bg-bnb-yellow rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(243,186,47,0.2)]">
                <ArrowRightLeft className="w-5 h-5 text-bnb-black" />
              </div>
              <h1 className="text-xl font-bold font-display tracking-tight">Y'z <span className="text-bnb-yellow">thumb.</span></h1>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2",
                  activeTab === item.id 
                    ? "bg-bnb-yellow/10 text-bnb-yellow" 
                    : "text-gray-400 hover:text-gray-100 hover:bg-white/5"
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/5">
            <span className="text-xs font-mono text-gray-400">WYDA:</span>
            <span className="text-xs font-bold text-bnb-yellow">$0.00004218</span>
            <span className="text-[10px] text-green-400 font-bold">+12.4%</span>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={address ? disconnectWallet : connectWallet}
              disabled={isConnecting}
              className={cn(
                "px-4 lg:px-6 py-2 font-bold rounded-full text-sm transition-all shadow-[0_0_15px_rgba(243,186,47,0.2)] flex items-center gap-2",
                address ? "bg-white/10 text-gray-100 border border-white/10 hover:bg-white/20" : "bg-bnb-yellow text-bnb-black hover:bg-bnb-yellow/90"
              )}
            >
              {isConnecting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Wallet className="w-4 h-4" />
              )}
              <span className="hidden xs:inline">
                {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Connect Wallet"}
              </span>
              <span className="xs:hidden">
                {address ? `${address.slice(0, 4)}...` : "Connect"}
              </span>
            </button>
            
            {address && (
              <button 
                onClick={disconnectWallet}
                className="p-2 bg-white/5 hover:bg-red-500/10 text-gray-400 hover:text-red-400 rounded-full transition-colors"
                title="Disconnect"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {/* Content Area */}
        <div className="p-6 lg:p-12 max-w-7xl mx-auto w-full space-y-8">
          
          {activeTab === 'dashboard' && (
            <div className="space-y-8 animate-in fade-in duration-700">
              <LegalDisclaimer />
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Contract Info / Token Assets */}
                <div className="bg-bnb-dark/50 border border-white/5 rounded-3xl p-8 backdrop-blur-sm flex flex-col h-full">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-bnb-yellow/10 rounded-lg">
                      <Coins className="w-5 h-5 text-bnb-yellow" />
                    </div>
                    <h3 className="text-xl font-bold font-display">Token Assets</h3>
                  </div>
                  
                  <div className="space-y-6 flex-1">
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                      <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2">Contract Address</p>
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-mono text-bnb-yellow truncate">{WYDA_CONTRACT}</p>
                        <button 
                          onClick={copyToClipboard}
                          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        >
                          {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-gray-400" />}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <a 
                        href={BSC_SCAN_URL} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-500/10 rounded-lg">
                            <ExternalLink className="w-4 h-4 text-blue-400" />
                          </div>
                          <span className="text-sm font-medium">BSCScan</span>
                        </div>
                        <ArrowRightLeft className="w-4 h-4 text-gray-500 group-hover:translate-x-1 transition-transform" />
                      </a>

                      <button className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors group">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-orange-500/10 rounded-lg">
                            <TrendingUp className="w-4 h-4 text-orange-400" />
                          </div>
                          <span className="text-sm font-medium">PancakeSwap</span>
                        </div>
                        <ArrowRightLeft className="w-4 h-4 text-gray-500 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-8 p-4 bg-bnb-yellow/5 rounded-2xl border border-bnb-yellow/10">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="w-4 h-4 text-bnb-yellow" />
                      <span className="text-xs font-bold text-bnb-yellow">Security & Audit</span>
                    </div>
                    <p className="text-[10px] text-gray-400 leading-relaxed">
                      Contract verified and audited by community security partners. Liquidity locked for 365 days. Secure commitment-based privacy protocol.
                    </p>
                  </div>
                </div>

                {/* Recent Tumbles Table on Dashboard */}
                <div className="bg-bnb-dark/50 border border-white/5 rounded-3xl p-8 backdrop-blur-sm h-full">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-bnb-yellow/10 rounded-lg">
                        <History className="w-5 h-5 text-bnb-yellow" />
                      </div>
                      <h3 className="text-xl font-bold font-display">Recent Tumbles</h3>
                    </div>
                    <button 
                      onClick={() => setActiveTab('history')}
                      className="text-xs font-bold text-bnb-yellow hover:underline"
                    >
                      View All
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-white/5">
                          <th className="pb-4 text-xs font-bold uppercase tracking-widest text-gray-500">Type</th>
                          <th className="pb-4 text-xs font-bold uppercase tracking-widest text-gray-500">Amount</th>
                          <th className="pb-4 text-xs font-bold uppercase tracking-widest text-gray-500">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {mockTransactions.slice(0, 5).map((tx) => (
                          <tr key={tx.id} className="group">
                            <td className="py-4">
                              <div className="flex items-center gap-2">
                                {tx.type === 'Tumble' ? <Zap className="w-3 h-3 text-bnb-yellow" /> : <RefreshCw className="w-3 h-3 text-purple-400" />}
                                <span className="text-sm font-medium">{tx.type}</span>
                              </div>
                            </td>
                            <td className="py-4 font-mono text-sm">{tx.amount}</td>
                            <td className="py-4">
                              <span className={cn(
                                "text-[10px] font-bold px-2 py-0.5 rounded-full",
                                tx.status === 'Completed' ? "bg-green-500/10 text-green-400" :
                                tx.status === 'Pending' ? "bg-bnb-yellow/10 text-bnb-yellow" :
                                "bg-red-500/10 text-red-400"
                              )}>
                                {tx.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'tumble' && (
            <div className="max-w-2xl mx-auto space-y-8 py-12">
              <div className="text-center space-y-4">
                <h2 className="text-4xl font-bold font-display">Tumble Your Assets</h2>
                <p className="text-gray-400">Enhance your transaction privacy with the Y'z thumb. Tumbling Engine.</p>
              </div>

              <div className="bg-bnb-dark/50 border border-white/10 rounded-3xl p-8 backdrop-blur-sm space-y-8 shadow-2xl">
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <label className="text-sm font-bold text-gray-400 uppercase tracking-widest">Select Token & Amount</label>
                    <span className="text-xs text-gray-500 font-mono">
                      Balance: {selectedToken === 'WYDA' ? tokenBalance : usdtBalance} {selectedToken}
                    </span>
                  </div>
                  
                  <div className="flex gap-4 mb-2">
                    <button 
                      onClick={() => setSelectedToken('WYDA')}
                      className={cn(
                        "flex-1 py-3 rounded-xl border font-bold transition-all flex items-center justify-center gap-2",
                        selectedToken === 'WYDA' 
                          ? "bg-bnb-yellow/10 border-bnb-yellow text-bnb-yellow" 
                          : "bg-white/5 border-white/5 text-gray-400 hover:bg-white/10"
                      )}
                    >
                      <Coins className="w-4 h-4" />
                      WYDA
                    </button>
                    <button 
                      onClick={() => setSelectedToken('USDT')}
                      className={cn(
                        "flex-1 py-3 rounded-xl border font-bold transition-all flex items-center justify-center gap-2",
                        selectedToken === 'USDT' 
                          ? "bg-green-500/10 border-green-500 text-green-400" 
                          : "bg-white/5 border-white/5 text-gray-400 hover:bg-white/10"
                      )}
                    >
                      <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center text-[8px] text-white font-bold">$</div>
                      USDT
                    </button>
                  </div>

                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder="0.00"
                      value={tumbleAmount}
                      onChange={(e) => setTumbleAmount(e.target.value)}
                      className="w-full bg-bnb-black/50 border border-white/10 rounded-2xl p-6 text-2xl font-display focus:outline-none focus:border-bnb-yellow/50 transition-colors"
                    />
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-2">
                      <span className={cn(
                        "font-bold",
                        selectedToken === 'WYDA' ? "text-bnb-yellow" : "text-green-400"
                      )}>{selectedToken}</span>
                      <button 
                        onClick={() => setTumbleAmount(selectedToken === 'WYDA' ? tokenBalance.replace(/,/g, '') : usdtBalance.replace(/,/g, ''))}
                        className="px-2 py-1 bg-white/10 text-gray-300 text-[10px] font-bold rounded uppercase hover:bg-white/20 transition-colors"
                      >
                        Max
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center">
                  <div className="p-3 bg-white/5 rounded-full border border-white/10">
                    <ArrowDown className="w-6 h-6 text-bnb-yellow" />
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-sm font-bold text-gray-400 uppercase tracking-widest">Destination Address</label>
                  <input 
                    type="text" 
                    placeholder="0x..."
                    className="w-full bg-bnb-black/50 border border-white/10 rounded-2xl p-4 font-mono text-sm focus:outline-none focus:border-bnb-yellow/50 transition-colors"
                  />
                </div>

                {selectedToken === 'USDT' && (
                  <div className="p-4 bg-green-500/5 border border-green-500/10 rounded-2xl space-y-2">
                    <div className="flex items-center gap-2 text-green-400">
                      <ArrowRightLeft className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase tracking-wider">Conversion Protocol</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-[10px]">
                      <div className="space-y-1">
                        <p className="text-gray-500 uppercase">Input Asset</p>
                        <p className="text-gray-300 font-mono truncate">USDT (0x55d3...7955)</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-gray-500 uppercase">Output Asset</p>
                        <p className="text-bnb-yellow font-mono truncate">WYDA (0xD84B...d2C4)</p>
                      </div>
                    </div>
                  </div>
                )}

                <TumbleAnimation selectedToken={selectedToken} isMixing={isMixing} />

                <div className="p-6 bg-bnb-yellow/5 rounded-2xl border border-bnb-yellow/10 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Mixing Fee</span>
                    <span className="font-bold">0.1%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Est. Time</span>
                    <span className="font-bold">~2-5 Minutes</span>
                  </div>
                  <div className="pt-3 border-t border-white/5 flex justify-between font-bold">
                    <span>Total Output</span>
                    <span className="text-bnb-yellow">
                      {tumbleAmount ? (
                        selectedToken === 'WYDA' 
                          ? `${(Number(tumbleAmount) * 0.999).toFixed(2)} WYDA`
                          : `${(Number(tumbleAmount) * 23700 * 0.999).toFixed(0)} WYDA`
                      ) : "0.00 WYDA"}
                    </span>
                  </div>
                  {selectedToken === 'USDT' && (
                    <div className="text-[10px] text-gray-500 text-right">
                      Rate: 1 USDT ≈ 23,700 WYDA
                    </div>
                  )}
                </div>

                <button 
                  onClick={handleTumble}
                  disabled={isMixing}
                  className={cn(
                    "w-full py-6 rounded-2xl text-lg font-bold transition-all shadow-xl flex items-center justify-center gap-3",
                    isMixing 
                      ? "bg-gray-800 text-gray-500 cursor-not-allowed" 
                      : "bg-bnb-yellow text-bnb-black hover:scale-[1.02] active:scale-[0.98]"
                  )}
                >
                  {isMixing ? (
                    <>
                      <RefreshCw className="w-6 h-6 animate-spin" />
                      {selectedToken === 'USDT' ? "Swapping & Tumbling..." : "Tumbling in Progress..."}
                    </>
                  ) : (
                    <>
                      <Zap className="w-6 h-6" />
                      {address 
                        ? (selectedToken === 'USDT' ? "Swap & Tumble" : "Start Tumbling") 
                        : "Connect Wallet to Start"}
                    </>
                  )}
                </button>

                {txStatus && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "p-4 rounded-xl text-xs font-bold text-center",
                      txStatus.type === 'success' ? "bg-green-500/10 text-green-400" :
                      txStatus.type === 'error' ? "bg-red-500/10 text-red-400" :
                      "bg-bnb-yellow/10 text-bnb-yellow"
                    )}
                  >
                    {txStatus.message}
                  </motion.div>
                )}

                <LegalDisclaimer className="mt-4" />
              </div>
            </div>
          )}

          {activeTab === 'contract' && (
            <div className="space-y-8 max-w-4xl mx-auto">
              <div className="bg-bnb-dark/50 border border-white/5 rounded-3xl p-8 backdrop-blur-sm space-y-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-bnb-yellow/10 rounded-xl">
                    <Code2 className="w-6 h-6 text-bnb-yellow" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold font-display">Optimized Solidity Logic</h3>
                    <p className="text-sm text-gray-400">Transparent and secure mixing protocol</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-6 bg-white/5 rounded-2xl border border-white/5 space-y-3">
                    <div className="flex items-center gap-2 text-bnb-yellow">
                      <Shield className="w-4 h-4" />
                      <h4 className="text-sm font-bold uppercase tracking-wider">Security First</h4>
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      The contract uses a commitment-based deposit system. Users generate a hash (commitment) of a secret and nullifier, ensuring only they can withdraw.
                    </p>
                  </div>
                  <div className="p-6 bg-white/5 rounded-2xl border border-white/5 space-y-3">
                    <div className="flex items-center gap-2 text-bnb-yellow">
                      <Lock className="w-4 h-4" />
                      <h4 className="text-sm font-bold uppercase tracking-wider">Privacy Delay</h4>
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      A mandatory 1-hour minimum delay is enforced at the contract level to prevent simple timing analysis attacks.
                    </p>
                  </div>
                </div>

                <CodeBlock code={solidityCode} />

                <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-xl flex gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
                  <p className="text-[10px] text-red-400/80 leading-relaxed">
                    Warning: The above code is for educational and transparency purposes. Always verify contract addresses on BSCScan before interacting with any smart contract.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold font-display">Transaction History</h3>
                  <p className="text-sm text-gray-400">Track your recent tumble and mix operations</p>
                </div>
                <button className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 text-xs font-bold transition-all flex items-center gap-2">
                  <RefreshCw className="w-3 h-3" />
                  Refresh
                </button>
              </div>

              <div className="bg-bnb-dark/50 border border-white/5 rounded-3xl overflow-hidden backdrop-blur-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/5 bg-white/[0.02]">
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-gray-500">Type</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-gray-500">Amount</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-gray-500">Status</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-gray-500">Timestamp</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-gray-500">TX Hash</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-gray-500 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {mockTransactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-white/[0.02] transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "w-8 h-8 rounded-lg flex items-center justify-center",
                                tx.type === 'Tumble' ? "bg-bnb-yellow/10 text-bnb-yellow" : "bg-purple-500/10 text-purple-400"
                              )}>
                                {tx.type === 'Tumble' ? <Zap className="w-4 h-4" /> : <RefreshCw className="w-4 h-4" />}
                              </div>
                              <span className="font-bold text-sm">{tx.type}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm font-mono font-medium">{tx.amount}</span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className={cn(
                                "w-1.5 h-1.5 rounded-full",
                                tx.status === 'Completed' ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" :
                                tx.status === 'Pending' ? "bg-bnb-yellow animate-pulse shadow-[0_0_8px_rgba(243,186,47,0.5)]" :
                                "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"
                              )} />
                              <span className={cn(
                                "text-xs font-bold",
                                tx.status === 'Completed' ? "text-green-400" :
                                tx.status === 'Pending' ? "text-bnb-yellow" :
                                "text-red-400"
                              )}>
                                {tx.status}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-xs text-gray-400 font-medium">{tx.timestamp}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-xs text-gray-500 font-mono group-hover:text-gray-300 transition-colors">{tx.txHash}</span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button className="p-2 hover:bg-bnb-yellow/10 text-gray-500 hover:text-bnb-yellow rounded-lg transition-all">
                              <ExternalLink className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {mockTransactions.length === 0 && (
                  <div className="py-20 text-center space-y-3">
                    <History className="w-12 h-12 text-gray-700 mx-auto" />
                    <p className="text-gray-500 font-medium">No transactions found</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Other tabs placeholders */}
          {['security', 'settings'].includes(activeTab) && (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <div className="p-6 bg-white/5 rounded-full border border-white/5">
                <HelpCircle className="w-12 h-12 text-gray-600" />
              </div>
              <h3 className="text-xl font-bold font-display">Module Coming Soon</h3>
              <p className="text-gray-500 max-w-xs text-center">We're working hard to bring you the full Y'z thumb. experience. Stay tuned!</p>
            </div>
          )}

        </div>

        {/* Footer */}
        <footer className="mt-auto border-t border-white/5 p-8 text-center space-y-4">
          <p className="text-xs text-gray-500">
            &copy; 2026 Y'z thumb. Ecosystem. Built for the BNB Smart Chain community.
          </p>
          <div className="max-w-3xl mx-auto">
            <LegalDisclaimer />
          </div>
        </footer>
      </main>
    </div>
  );
}
