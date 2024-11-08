import React, { useState, useEffect } from 'react';
import { ArrowDownIcon, WalletIcon, RefreshCwIcon, PlusIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { authService } from '../services/auth';
import { swapService } from '../services/swap';
import { formatAmount, parseAmount, calculateMinimumReceived } from '../utils/format';
import { TOKEN_CONFIG } from '../constants/canisters';

const SwapInterface = () => {
  const [inputAmount, setInputAmount] = useState('');
  const [outputAmount, setOutputAmount] = useState('');
  const [isIcpToCkBtc, setIsIcpToCkBtc] = useState(true);
  const [slippageTolerance, setSlippageTolerance] = useState(0.5);
  const [isLoading, setIsLoading] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const [showSlippageOptions, setShowSlippageOptions] = useState(false);
  const [showCustomSlippage, setShowCustomSlippage] = useState(false);
  const [customSlippageInput, setCustomSlippageInput] = useState('');
  const [swapStatus, setSwapStatus] = useState('');

  const SLIPPAGE_OPTIONS = [0.5, 1, 2, 5];

  useEffect(() => {
    checkWalletConnection();
  }, []);

  const checkWalletConnection = async () => {
    const isAuthenticated = await authService.isAuthenticated();
    setWalletConnected(isAuthenticated);
  };

  const getQuote = async (amount) => {
    if (!amount || amount <= 0) return;
    setIsLoading(true);
    
    try {
      const parsedAmount = parseAmount(amount, isIcpToCkBtc ? 'ICP' : 'CKBTC');
      const quote = await swapService.getQuote(
        parsedAmount,
        !isIcpToCkBtc // zeroForOne is opposite of isIcpToCkBtc
      );
      setOutputAmount(formatAmount(quote, isIcpToCkBtc ? 'CKBTC' : 'ICP'));
    } catch (error) {
      console.error('Quote error:', error);
      setOutputAmount('');
      setSwapStatus('Failed to get quote: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (value) => {
    setInputAmount(value);
    if (value && !isNaN(value)) {
      getQuote(value);
    } else {
      setOutputAmount('');
    }
  };

  const handleCustomSlippageChange = (value) => {
    if (value === '' || (!isNaN(value) && parseFloat(value) >= 0 && parseFloat(value) <= 100)) {
      setCustomSlippageInput(value);
      if (value !== '') {
        setSlippageTolerance(parseFloat(value));
      }
    }
  };

  const switchTokens = () => {
    setIsIcpToCkBtc(!isIcpToCkBtc);
    setInputAmount('');
    setOutputAmount('');
  };

  const connectWallet = async () => {
    try {
      const identity = await authService.login();
      if (identity) {
        setWalletConnected(true);
      }
    } catch (error) {
      console.error('Login error:', error);
      setSwapStatus('Failed to connect wallet: ' + error.message);
      setTimeout(() => setSwapStatus(''), 3000);
    }
  };

  const executeSwap = async () => {
    if (!walletConnected || !inputAmount || !outputAmount) return;

    setSwapStatus('Approving...');
    try {
      const inputToken = isIcpToCkBtc ? 'ICP' : 'CKBTC';
      const parsedInputAmount = parseAmount(inputAmount, inputToken);
      
      // Calculate minimum amount to receive based on slippage
      const parsedOutputAmount = parseAmount(outputAmount, isIcpToCkBtc ? 'CKBTC' : 'ICP');
      const minAmountOut = calculateMinimumReceived(parsedOutputAmount, slippageTolerance);

      // Execute the swap
      await swapService.executeSwap(
        parsedInputAmount,
        minAmountOut,
        !isIcpToCkBtc // zeroForOne is opposite of isIcpToCkBtc
      );

      setSwapStatus('Success!');
      // Reset form
      setInputAmount('');
      setOutputAmount('');
    } catch (error) {
      console.error('Swap error:', error);
      setSwapStatus('Failed: ' + error.message);
    } finally {
      setTimeout(() => setSwapStatus(''), 5000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-xl p-4"
      >
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-bold">Swap</h1>
          <button
            onClick={connectWallet}
            className={`flex items-center px-3 py-1.5 rounded-lg ${
              walletConnected 
                ? 'bg-purple-600 text-white' 
                : 'bg-purple-500 hover:bg-purple-600'
            } transition-all duration-200 text-sm`}
          >
            <WalletIcon className="w-4 h-4 mr-1.5" />
            {walletConnected ? 'Connected' : 'Connect Wallet'}
          </button>
        </div>

        {/* Input Token */}
        <div className="bg-gray-800 rounded-lg p-3 mb-3">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm text-gray-400">From</span>
            <span className="text-purple-400 font-medium text-sm">
              {isIcpToCkBtc ? 'ICP' : 'ckBTC'}
            </span>
          </div>
          <input
            type="number"
            value={inputAmount}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder="0.0"
            className="w-full bg-transparent text-xl outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0"
          />
        </div>

        {/* Swap Direction Button */}
        <div className="flex justify-center my-2 relative z-10">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={switchTokens}
            className="bg-gray-700 p-1 rounded-full hover:bg-gray-600 transition-all"
          >
            <ArrowDownIcon className="w-3 h-3 text-purple-400" />
          </motion.button>
        </div>

        {/* Output Token */}
        <div className="bg-gray-800 rounded-lg p-3 mb-3">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm text-gray-400">To</span>
            <span className="text-purple-400 font-medium text-sm">
              {isIcpToCkBtc ? 'ckBTC' : 'ICP'}
            </span>
          </div>
          <div className="flex items-center">
            <input
              type="text"
              value={outputAmount}
              readOnly
              placeholder="0.0"
              className="w-full bg-transparent text-xl outline-none"
            />
            {isLoading && (
              <RefreshCwIcon className="w-4 h-4 text-purple-400 animate-spin" />
            )}
          </div>
        </div>

        {/* Slippage Settings */}
        <div className="mb-3">
          <div 
            className="flex items-center justify-between text-sm cursor-pointer"
            onClick={() => setShowSlippageOptions(!showSlippageOptions)}
          >
            <span className="text-gray-400">Slippage Tolerance</span>
            <span className="text-purple-400">{slippageTolerance}%</span>
          </div>
          {showSlippageOptions && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-2 mt-2"
            >
              {SLIPPAGE_OPTIONS.map((value) => (
                <button
                  key={value}
                  onClick={() => {
                    setSlippageTolerance(value);
                    setShowCustomSlippage(false);
                    setCustomSlippageInput('');
                  }}
                  className={`flex-1 py-1 rounded text-sm ${
                    slippageTolerance === value && !showCustomSlippage
                      ? 'bg-purple-500 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {value}%
                </button>
              ))}
              <button
                className={`flex-1 py-1 px-2 rounded text-sm ${
                  showCustomSlippage 
                    ? 'bg-purple-500 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
                onClick={() => {
                  setShowCustomSlippage(!showCustomSlippage);
                  if (!showCustomSlippage) {
                    setCustomSlippageInput(slippageTolerance.toString());
                  }
                }}
              >
                <PlusIcon className="w-4 h-4 mx-auto" />
              </button>
            </motion.div>
          )}
          {showCustomSlippage && showSlippageOptions && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-2 flex items-center gap-2"
            >
              <input
                type="number"
                value={customSlippageInput}
                onChange={(e) => handleCustomSlippageChange(e.target.value)}
                placeholder="Custom"
                className="flex-1 bg-gray-700 rounded px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-purple-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <span className="text-sm text-gray-400">%</span>
            </motion.div>
          )}
        </div>

        {/* Status Message */}
        {swapStatus && (
          <div className="mb-3 text-sm text-center">
            <span className={`${
              swapStatus.includes('Failed') ? 'text-red-400' : 'text-purple-400'
            }`}>
              {swapStatus}
            </span>
          </div>
        )}

        {/* Swap Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={executeSwap}
          disabled={!inputAmount || !outputAmount || isLoading || !walletConnected}
          className={`w-full py-3 rounded-lg font-bold text-white text-sm
            ${inputAmount && outputAmount && !isLoading && walletConnected
              ? 'bg-purple-500 hover:bg-purple-600'
              : 'bg-gray-600 cursor-not-allowed'
            } transition-all duration-200`}
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <RefreshCwIcon className="w-4 h-4 animate-spin mr-2" />
              Getting Quote
            </span>
          ) : !walletConnected ? (
            'Connect Wallet to Swap'
          ) : (
            'Swap'
          )}
        </motion.button>
      </motion.div>
    </div>
  );
};

export default SwapInterface;