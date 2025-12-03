import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Bitcoin, RefreshCw, Plus, Trash2, Edit2, Check, X } from 'lucide-react';

export default function App() {
  const [btcPriceUsd, setBtcPriceUsd] = useState(null);
  const [btcPriceEur, setBtcPriceEur] = useState(null);
  const [priceChange24h, setPriceChange24h] = useState(0);
  const [currency, setCurrency] = useState('usd');
  const [holdings, setHoldings] = useState(() => {
    const saved = localStorage.getItem('btc-holdings');
    return saved ? JSON.parse(saved) : [
      { id: 1, name: 'Ledger Wallet', amount: 0.5, buyPriceUsd: 50000, buyPriceEur: 45000 },
      { id: 2, name: 'eToro', amount: 0.15, buyPriceUsd: 58000, buyPriceEur: 52000 }
    ];
  });
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', amount: '', buyPrice: '' });
  const [showAddForm, setShowAddForm] = useState(false);
  const [newHolding, setNewHolding] = useState({ name: '', amount: '', buyPrice: '' });
  const [error, setError] = useState(null);

  const btcPrice = currency === 'usd' ? btcPriceUsd : btcPriceEur;
  const currencySymbol = currency === 'usd' ? '$' : '€';

  // Sauvegarder les holdings dans localStorage
  useEffect(() => {
    localStorage.setItem('btc-holdings', JSON.stringify(holdings));
  }, [holdings]);

  const fetchBtcPrice = async () => {
    setLoading(true);
    setError(null);
    
    const apis = [
      {
        name: 'CoinGecko',
        url: 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd,eur&include_24hr_change=true',
        parse: (data) => ({
          usd: data.bitcoin.usd,
          eur: data.bitcoin.eur,
          change: data.bitcoin.usd_24h_change
        })
      },
      {
        name: 'Coinbase',
        url: 'https://api.coinbase.com/v2/exchange-rates?currency=BTC',
        parse: (data) => ({
          usd: parseFloat(data.data.rates.USD),
          eur: parseFloat(data.data.rates.EUR),
          change: 0
        })
      }
    ];

    for (const api of apis) {
      try {
        const response = await fetch(api.url);
        if (!response.ok) continue;
        
        const data = await response.json();
        const parsed = api.parse(data);
        
        setBtcPriceUsd(parsed.usd);
        setBtcPriceEur(parsed.eur);
        setPriceChange24h(parsed.change);
        setLastUpdate(new Date());
        setLoading(false);
        return;
      } catch (err) {
        console.warn(`${api.name} failed:`, err);
        continue;
      }
    }
    
    setError('Impossible de récupérer le prix. Vérifie ta connexion.');
    setLoading(false);
  };

  useEffect(() => {
    fetchBtcPrice();
    const interval = setInterval(fetchBtcPrice, 30000);
    return () => clearInterval(interval);
  }, []);

  const totalBtc = holdings.reduce((sum, h) => sum + h.amount, 0);
  const totalValue = btcPrice ? totalBtc * btcPrice : 0;
  const totalInvested = holdings.reduce((sum, h) => sum + (h.amount * (currency === 'usd' ? h.buyPriceUsd : h.buyPriceEur)), 0);
  const totalProfitLoss = totalValue - totalInvested;
  const totalProfitLossPercent = totalInvested > 0 ? ((totalProfitLoss / totalInvested) * 100) : 0;

  const formatCurrency = (value) => {
    return new Intl.NumberFormat(currency === 'usd' ? 'en-US' : 'fr-FR', { 
      style: 'currency', 
      currency: currency.toUpperCase() 
    }).format(value);
  };

  const formatBtc = (value) => {
    return value.toFixed(8) + ' BTC';
  };

  const startEdit = (holding) => {
    setEditingId(holding.id);
    const buyPrice = currency === 'usd' ? holding.buyPriceUsd : holding.buyPriceEur;
    setEditForm({ name: holding.name, amount: holding.amount.toString(), buyPrice: buyPrice.toString() });
  };

  const saveEdit = () => {
    const newBuyPrice = parseFloat(editForm.buyPrice) || 0;
    setHoldings(holdings.map(h => 
      h.id === editingId 
        ? { 
            ...h, 
            name: editForm.name, 
            amount: parseFloat(editForm.amount) || 0, 
            buyPriceUsd: currency === 'usd' ? newBuyPrice : h.buyPriceUsd,
            buyPriceEur: currency === 'eur' ? newBuyPrice : h.buyPriceEur
          }
        : h
    ));
    setEditingId(null);
  };

  const deleteHolding = (id) => {
    setHoldings(holdings.filter(h => h.id !== id));
  };

  const addHolding = () => {
    if (newHolding.name && newHolding.amount) {
      const buyPrice = parseFloat(newHolding.buyPrice) || btcPrice || 0;
      setHoldings([...holdings, {
        id: Date.now(),
        name: newHolding.name,
        amount: parseFloat(newHolding.amount) || 0,
        buyPriceUsd: currency === 'usd' ? buyPrice : (btcPriceUsd || 0),
        buyPriceEur: currency === 'eur' ? buyPrice : (btcPriceEur || 0)
      }]);
      setNewHolding({ name: '', amount: '', buyPrice: '' });
      setShowAddForm(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="bg-orange-500 p-3 rounded-xl">
              <Bitcoin className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Bitcoin Portfolio</h1>
              <p className="text-gray-400 text-sm">Suivi en temps réel</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setCurrency(currency === 'usd' ? 'eur' : 'usd')}
              className="flex items-center gap-2 bg-orange-600 hover:bg-orange-500 px-4 py-2 rounded-lg transition-colors font-semibold"
            >
              {currency === 'usd' ? '$ USD' : '€ EUR'}
            </button>
            <button 
              onClick={fetchBtcPrice}
              className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </button>
          </div>
        </div>

        {/* Prix BTC actuel */}
        <div className="bg-gray-800/50 backdrop-blur rounded-2xl p-6 mb-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Prix Bitcoin</p>
              <p className="text-4xl font-bold">
                {btcPrice ? formatCurrency(btcPrice) : '---'}
              </p>
            </div>
            {btcPrice && priceChange24h !== 0 && (
              <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${priceChange24h >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                {priceChange24h >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                <span className="font-semibold">{priceChange24h.toFixed(2)}%</span>
                <span className="text-sm opacity-75">24h</span>
              </div>
            )}
          </div>
          {error && (
            <div className="mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm">
              {error}
            </div>
          )}
          {lastUpdate && (
            <p className="text-gray-500 text-xs mt-4">
              Dernière mise à jour: {lastUpdate.toLocaleTimeString('fr-FR')}
            </p>
          )}
        </div>

        {/* Résumé du portfolio */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-800/50 backdrop-blur rounded-xl p-5 border border-gray-700">
            <p className="text-gray-400 text-sm mb-1">Valeur totale</p>
            <p className="text-2xl font-bold text-orange-400">{formatCurrency(totalValue)}</p>
            <p className="text-gray-500 text-sm">{formatBtc(totalBtc)}</p>
          </div>
          <div className="bg-gray-800/50 backdrop-blur rounded-xl p-5 border border-gray-700">
            <p className="text-gray-400 text-sm mb-1">Investi</p>
            <p className="text-2xl font-bold">{formatCurrency(totalInvested)}</p>
          </div>
          <div className="bg-gray-800/50 backdrop-blur rounded-xl p-5 border border-gray-700">
            <p className="text-gray-400 text-sm mb-1">Profit / Perte</p>
            <p className={`text-2xl font-bold ${totalProfitLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {totalProfitLoss >= 0 ? '+' : ''}{formatCurrency(totalProfitLoss)}
            </p>
            <p className={`text-sm ${totalProfitLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {totalProfitLossPercent >= 0 ? '+' : ''}{totalProfitLossPercent.toFixed(2)}%
            </p>
          </div>
        </div>

        {/* Liste des holdings */}
        <div className="bg-gray-800/50 backdrop-blur rounded-2xl border border-gray-700 overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-gray-700">
            <h2 className="text-lg font-semibold">Mes positions</h2>
            <button 
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 px-4 py-2 rounded-lg transition-colors text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Ajouter
            </button>
          </div>

          {/* Formulaire d'ajout */}
          {showAddForm && (
            <div className="p-4 bg-gray-700/50 border-b border-gray-700">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <input
                  type="text"
                  placeholder="Nom (ex: Ledger)"
                  value={newHolding.name}
                  onChange={(e) => setNewHolding({...newHolding, name: e.target.value})}
                  className="bg-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <input
                  type="number"
                  step="0.00000001"
                  placeholder="Quantité BTC"
                  value={newHolding.amount}
                  onChange={(e) => setNewHolding({...newHolding, amount: e.target.value})}
                  className="bg-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <input
                  type="number"
                  placeholder={`Prix d'achat (${currencySymbol})`}
                  value={newHolding.buyPrice}
                  onChange={(e) => setNewHolding({...newHolding, buyPrice: e.target.value})}
                  className="bg-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <div className="flex gap-2">
                  <button onClick={addHolding} className="flex-1 bg-green-600 hover:bg-green-700 rounded-lg px-3 py-2 text-sm transition-colors">
                    <Check className="w-4 h-4 mx-auto" />
                  </button>
                  <button onClick={() => setShowAddForm(false)} className="flex-1 bg-gray-600 hover:bg-gray-500 rounded-lg px-3 py-2 text-sm transition-colors">
                    <X className="w-4 h-4 mx-auto" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Liste */}
          <div className="divide-y divide-gray-700">
            {holdings.map((holding) => {
              const buyPrice = currency === 'usd' ? holding.buyPriceUsd : holding.buyPriceEur;
              const currentValue = btcPrice ? holding.amount * btcPrice : 0;
              const invested = holding.amount * buyPrice;
              const profitLoss = currentValue - invested;
              const profitLossPercent = invested > 0 ? ((profitLoss / invested) * 100) : 0;

              return (
                <div key={holding.id} className="p-5 hover:bg-gray-700/30 transition-colors">
                  {editingId === holding.id ? (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                        className="bg-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                      <input
                        type="number"
                        step="0.00000001"
                        value={editForm.amount}
                        onChange={(e) => setEditForm({...editForm, amount: e.target.value})}
                        className="bg-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                      <input
                        type="number"
                        value={editForm.buyPrice}
                        onChange={(e) => setEditForm({...editForm, buyPrice: e.target.value})}
                        className="bg-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                        placeholder={`Prix (${currencySymbol})`}
                      />
                      <div className="flex gap-2">
                        <button onClick={saveEdit} className="flex-1 bg-green-600 hover:bg-green-700 rounded-lg px-3 py-2 text-sm transition-colors">
                          <Check className="w-4 h-4 mx-auto" />
                        </button>
                        <button onClick={() => setEditingId(null)} className="flex-1 bg-gray-600 hover:bg-gray-500 rounded-lg px-3 py-2 text-sm transition-colors">
                          <X className="w-4 h-4 mx-auto" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium">{holding.name}</p>
                        <p className="text-gray-400 text-sm">{formatBtc(holding.amount)}</p>
                      </div>
                      <div className="text-right flex-1">
                        <p className="font-semibold">{formatCurrency(currentValue)}</p>
                        <p className="text-gray-400 text-sm">Acheté à {formatCurrency(buyPrice)}/BTC</p>
                      </div>
                      <div className={`text-right flex-1 ${profitLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        <p className="font-semibold">{profitLoss >= 0 ? '+' : ''}{formatCurrency(profitLoss)}</p>
                        <p className="text-sm">{profitLossPercent >= 0 ? '+' : ''}{profitLossPercent.toFixed(2)}%</p>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button 
                          onClick={() => startEdit(holding)}
                          className="p-2 hover:bg-gray-600 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4 text-gray-400" />
                        </button>
                        <button 
                          onClick={() => deleteHolding(holding.id)}
                          className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-500 text-sm mt-6">
          Prix fournis par CoinGecko / Coinbase • Actualisation automatique toutes les 30 secondes
        </p>
      </div>
    </div>
  );
}
