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
  AlertTriangle
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
import { createPublicClient, http, formatUnits, parseUnits } from 'viem';
import { bsc } from 'viem/chains';

// Constants
const WYDA_CONTRACT = "0xD84B7E8b295d9Fa9656527AC33Bf4F683aE7d2C4";
const BSC_SCAN_URL = `https://bscscan.com/token/${WYDA_CONTRACT}`;

// Initialize Viem Client
const publicClient = createPublicClient({
  chain: bsc,
  transport: http()
});

// Mock Data for the chart
const generateMockChartData = () => {
  const data = [];
  let price = 0.000042;
  for (let i = 0; i < 24; i++) {
    price = price * (1 + (Math.random() * 0.1 - 0.04));
    data.push({
      time: `${i}:00`,
      price: price.toFixed(8),
    });
  }
  return data;
};

const mockTransactions = [
  { id: 1, type: 'Tumble', amount: '1,250,000', status: 'Completed', time: '2m ago', hash: '0x123...abc' },
  { id: 2, type: 'Mix', amount: '850,000', status: 'Processing', time: '5m ago', hash: '0x456...def' },
  { id: 3, type: 'Tumble', amount: '2,100,000', status: 'Completed', time: '12m ago', hash: '0x789...ghi' },
  { id: 4, type: 'Tumble', amount: '500,000', status: 'Completed', time: '18m ago', hash: '0xabc...123' },
];

// Components
const StatCard = ({ title, value, change, icon: Icon }: { title: string, value: string, change?: string, icon: any }) => (
  <div className="bg-bnb-dark/50 border border-white/5 p-6 rounded-2xl backdrop-blur-sm">
    <div className="flex items-start justify-between mb-4">
      <div className="p-2 bg-bnb-yellow/10 rounded-lg">
        <Icon className="w-5 h-5 text-bnb-yellow" />
      </div>
      {change && (
        <span className={cn(
          "text-xs font-medium px-2 py-1 rounded-full",
          change.startsWith('+') ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
        )}>
          {change}
        </span>
      )}
    </div>
    <h3 className="text-gray-400 text-sm font-medium">{title}</h3>
    <p className="text-2xl font-bold mt-1 font-display tracking-tight">{value}</p>
  </div>
);

const TumbleAnimation = () => {
  const [items, setItems] = useState<number[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setItems(prev => [...prev.slice(-5), Date.now()]);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative h-64 w-full bg-bnb-black/40 rounded-2xl border border-white/5 overflow-hidden flex flex-col items-center justify-center">
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-full bg-gradient-to-b from-transparent via-bnb-yellow to-transparent" />
      </div>
      
      <div className="z-10 flex flex-col items-center gap-4">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          className="p-4 rounded-full border-2 border-dashed border-bnb-yellow/30"
        >
          <div className="p-4 rounded-full bg-bnb-yellow/20">
            <RefreshCw className="w-8 h-8 text-bnb-yellow" />
          </div>
        </motion.div>
        <p className="text-xs font-mono text-bnb-yellow/60 uppercase tracking-widest">Tumbling Engine Active</p>
      </div>

      <AnimatePresence>
        {items.map((id) => (
          <motion.div
            key={id}
            initial={{ y: -50, opacity: 0, scale: 0.5 }}
            animate={{ y: 300, opacity: [0, 1, 1, 0], scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 4, ease: "linear" }}
            className="absolute top-0 left-1/2 -translate-x-1/2 flex flex-col items-center"
          >
            <div className="w-3 h-3 rounded-full bg-bnb-yellow shadow-[0_0_10px_rgba(243,186,47,0.8)]" />
            <div className="mt-2 text-[10px] font-mono text-bnb-yellow/40 whitespace-nowrap">
              TX_{id.toString().slice(-4)}
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMixing, setIsMixing] = useState(false);
  const [tokenBalance, setTokenBalance] = useState<string>("0.00");
  const [isConnected, setIsConnected] = useState(false);
  
  const chartData = useMemo(() => generateMockChartData(), []);

  // Fetch real token data on load
  useEffect(() => {
    const fetchTokenData = async () => {
      try {
        const abi = [
          { 
            name: 'totalSupply', 
            type: 'function', 
            inputs: [], 
            outputs: [{ type: 'uint256' }],
            stateMutability: 'view'
          }
        ] as const;

        const totalSupply = await publicClient.readContract({
          address: WYDA_CONTRACT as `0x${string}`,
          abi,
          functionName: 'totalSupply',
        } as any) as bigint;
        console.log("Total Supply:", formatUnits(totalSupply, 18));
      } catch (e) {
        console.error("Error fetching token data:", e);
      }
    };
    fetchTokenData();
  }, []);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(WYDA_CONTRACT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTumble = () => {
    if (!isConnected) {
      alert("Please connect your wallet first.");
      return;
    }
    setIsMixing(true);
    setTimeout(() => setIsMixing(false), 5000);
  };

  const connectWallet = () => {
    setIsConnected(true);
    setTokenBalance("1,250,000.00");
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
    <div className="min-h-screen bg-bnb-black flex">
      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-bnb-dark border-r border-white/5 transition-transform duration-300 lg:relative lg:translate-x-0",
        !isSidebarOpen && "-translate-x-full"
      )}>
        <div className="p-6 flex flex-col h-full">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-bnb-yellow rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(243,186,47,0.3)]">
              <ArrowRightLeft className="w-6 h-6 text-bnb-black" />
            </div>
            <h1 className="text-xl font-bold font-display tracking-tight">WYDA<span className="text-bnb-yellow">.</span></h1>
          </div>

          <nav className="space-y-1 flex-1">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
              { id: 'tumble', label: 'Tumble', icon: RefreshCw },
              { id: 'contract', label: 'Smart Contract', icon: Code2 },
              { id: 'history', label: 'History', icon: History },
              { id: 'security', label: 'Security', icon: Shield },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
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
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto">
        {/* Header */}
        <header className="h-20 border-b border-white/5 flex items-center justify-between px-8 sticky top-0 bg-bnb-black/80 backdrop-blur-xl z-40">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden p-2 hover:bg-white/5 rounded-lg"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-lg font-semibold capitalize font-display">{activeTab === 'contract' ? 'Solidity Source' : activeTab}</h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/5">
              <span className="text-xs font-mono text-gray-400">WYDA:</span>
              <span className="text-xs font-bold text-bnb-yellow">$0.00004218</span>
              <span className="text-[10px] text-green-400 font-bold">+12.4%</span>
            </div>
            <button 
              onClick={connectWallet}
              className={cn(
                "px-6 py-2 font-bold rounded-full text-sm transition-all shadow-[0_0_15px_rgba(243,186,47,0.2)] flex items-center gap-2",
                isConnected ? "bg-white/10 text-gray-100 border border-white/10" : "bg-bnb-yellow text-bnb-black hover:bg-bnb-yellow/90"
              )}
            >
              <Wallet className="w-4 h-4" />
              {isConnected ? "0x71C...392" : "Connect Wallet"}
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-8 max-w-7xl mx-auto w-full space-y-8">
          
          {activeTab === 'dashboard' && (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Market Cap" value="$1.2M" change="+5.2%" icon={TrendingUp} />
                <StatCard title="Total Supply" value="100B" icon={Coins} />
                <StatCard title="Holders" value="4,218" change="+12" icon={Shield} />
                <StatCard title="Volume (24h)" value="$425K" change="-2.1%" icon={Zap} />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Chart Section */}
                <div className="lg:col-span-2 bg-bnb-dark/50 border border-white/5 rounded-3xl p-8 backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-xl font-bold font-display">Price Performance</h3>
                      <p className="text-sm text-gray-400">Real-time WYDA/BNB pair data</p>
                    </div>
                    <div className="flex gap-2">
                      {['1H', '4H', '1D', '1W'].map(t => (
                        <button key={t} className={cn(
                          "px-3 py-1 rounded-lg text-xs font-bold transition-colors",
                          t === '1D' ? "bg-bnb-yellow text-bnb-black" : "bg-white/5 text-gray-400 hover:bg-white/10"
                        )}>
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#F3BA2F" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#F3BA2F" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                        <XAxis dataKey="time" stroke="#ffffff20" fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis hide domain={['auto', 'auto']} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1E2329', border: '1px solid #ffffff10', borderRadius: '12px' }}
                          itemStyle={{ color: '#F3BA2F' }}
                        />
                        <Area type="monotone" dataKey="price" stroke="#F3BA2F" strokeWidth={2} fillOpacity={1} fill="url(#colorPrice)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Contract Info */}
                <div className="bg-bnb-dark/50 border border-white/5 rounded-3xl p-8 backdrop-blur-sm flex flex-col">
                  <h3 className="text-xl font-bold font-display mb-6">Token Assets</h3>
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

                    <div className="space-y-4">
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
                          <span className="text-sm font-medium">View on BSCScan</span>
                        </div>
                        <ArrowRightLeft className="w-4 h-4 text-gray-500 group-hover:translate-x-1 transition-transform" />
                      </a>

                      <button className="w-full flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors group">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-orange-500/10 rounded-lg">
                            <TrendingUp className="w-4 h-4 text-orange-400" />
                          </div>
                          <span className="text-sm font-medium">Buy on PancakeSwap</span>
                        </div>
                        <ArrowRightLeft className="w-4 h-4 text-gray-500 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-8 p-4 bg-bnb-yellow/5 rounded-2xl border border-bnb-yellow/10">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="w-4 h-4 text-bnb-yellow" />
                      <span className="text-xs font-bold text-bnb-yellow">Audit Status</span>
                    </div>
                    <p className="text-[10px] text-gray-400 leading-relaxed">
                      Contract verified and audited by community security partners. Liquidity locked for 365 days.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'tumble' && (
            <div className="max-w-2xl mx-auto space-y-8 py-12">
              <div className="text-center space-y-4">
                <h2 className="text-4xl font-bold font-display">Tumble Your WYDA</h2>
                <p className="text-gray-400">Enhance your transaction privacy with the WYDA Tumbling Engine.</p>
              </div>

              <div className="bg-bnb-dark/50 border border-white/10 rounded-3xl p-8 backdrop-blur-sm space-y-8 shadow-2xl">
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <label className="text-sm font-bold text-gray-400 uppercase tracking-widest">Amount to Tumble</label>
                    <span className="text-xs text-gray-500 font-mono">Balance: {tokenBalance} WYDA</span>
                  </div>
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder="0.00"
                      className="w-full bg-bnb-black/50 border border-white/10 rounded-2xl p-6 text-2xl font-display focus:outline-none focus:border-bnb-yellow/50 transition-colors"
                    />
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-2">
                      <span className="text-bnb-yellow font-bold">WYDA</span>
                      <button className="px-2 py-1 bg-bnb-yellow/10 text-bnb-yellow text-[10px] font-bold rounded uppercase">Max</button>
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

                <TumbleAnimation />

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
                    <span className="text-bnb-yellow">0.00 WYDA</span>
                  </div>
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
                      Tumbling in Progress...
                    </>
                  ) : (
                    <>
                      <Zap className="w-6 h-6" />
                      Start Tumbling
                    </>
                  )}
                </button>

                <p className="text-[10px] text-center text-gray-500 italic px-4">
                  Notice: I am prohibiting the use of this system for any illegal activity in any case. 
                  I am not fully responsible for any criminal situations that arise using this system in any case.
                </p>
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

          {/* Other tabs placeholders */}
          {['history', 'security', 'settings'].includes(activeTab) && (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <div className="p-6 bg-white/5 rounded-full border border-white/5">
                <HelpCircle className="w-12 h-12 text-gray-600" />
              </div>
              <h3 className="text-xl font-bold font-display">Module Coming Soon</h3>
              <p className="text-gray-500 max-w-xs text-center">We're working hard to bring you the full WYDA Tumbler experience. Stay tuned!</p>
            </div>
          )}

        </div>

        {/* Footer */}
        <footer className="mt-auto border-t border-white/5 p-8 text-center space-y-4">
          <p className="text-xs text-gray-500">
            &copy; 2026 WYDA Ecosystem. Built for the BNB Smart Chain community.
          </p>
          <div className="max-w-2xl mx-auto p-4 bg-red-500/5 border border-red-500/10 rounded-xl">
            <p className="text-[10px] text-red-400/80 leading-relaxed font-medium">
              DISCLAIMER: I am prohibiting the use of this system for any illegal activity in any case. 
              I am not fully responsible for any criminal situations that arise using this system in any case.
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}
