import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Bitcoin, RefreshCw, Plus, Trash2, Edit2, Check, X, ChevronDown, ChevronUp } from 'lucide-react';

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
  const [expandedId, setExpandedId] = useState(null);

  const btcPrice = currency === 'usd' ? btcPriceUsd : btcPriceEur;
  const currencySymbol = currency === 'usd' ? '$' : '€';

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
    
    setError('Impossible de récupérer le prix');
    setLoading(false);
  };

  useEffect(() => {
    fetchBtcPrice();
    const interval = setInterval(fetchBtcPrice, 10000);
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
      currency: currency.toUpperCase(),
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatCurrencyPrecise = (value) => {
    return new Intl.NumberFormat(currency === 'usd' ? 'en-US' : 'fr-FR', { 
      style: 'currency', 
      currency: currency.toUpperCase()
    }).format(value);
  };

  const formatBtc = (value) => {
    return value.toFixed(6) + ' BTC';
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
    setExpandedId(null);
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

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-950 text-white">
      {/* Header sticky */}
      <header className="sticky top-0 z-10 bg-gray-900/95 backdrop-blur border-b border-gray-800 px-4 py-3">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <div className="flex items-center gap-2">
            <div className="bg-orange-500 p-2 rounded-lg">
              <Bitcoin className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg">BTC Wallet Honoré</span>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setCurrency(currency === 'usd' ? 'eur' : 'usd')}
              className="bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
            >
              {currency === 'usd' ? '$' : '€'}
            </button>
            <button 
              onClick={fetchBtcPrice}
              className="bg-gray-800 hover:bg-gray-700 p-2 rounded-lg transition-colors"
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      <main className="px-4 py-4 max-w-2xl mx-auto space-y-4">
        {/* Prix BTC - Card principale */}
        <div className={`rounded-2xl p-5 shadow-lg ${
          priceChange24h >= 0 
            ? 'bg-gradient-to-br from-green-600 to-green-700' 
            : 'bg-gradient-to-br from-red-600 to-red-700'
        }`}>
          <div className="flex items-start justify-between">
            <div>
              <p className={`text-sm mb-1 ${priceChange24h >= 0 ? 'text-green-100' : 'text-red-100'}`}>Bitcoin</p>
              <p className="text-3xl sm:text-4xl font-bold">
                {btcPrice ? formatCurrency(btcPrice) : '---'}
              </p>
            </div>
            {btcPrice && priceChange24h !== 0 && (
              <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-sm font-medium ${
                priceChange24h >= 0 
                  ? 'bg-green-500/30 text-green-100' 
                  : 'bg-red-500/30 text-red-100'
              }`}>
                {priceChange24h >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                {priceChange24h.toFixed(2)}%
              </div>
            )}
          </div>
          {error && (
            <p className={`mt-3 text-sm ${priceChange24h >= 0 ? 'text-green-200' : 'text-red-200'}`}>{error}</p>
          )}
          {lastUpdate && (
            <p className={`text-xs mt-3 ${priceChange24h >= 0 ? 'text-green-200/60' : 'text-red-200/60'}`}>
              Mis à jour à {lastUpdate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
        </div>

        {/* Résumé portfolio - Grid 2 colonnes sur mobile */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
            <p className="text-gray-400 text-xs mb-1">Valeur totale</p>
            <p className="text-xl sm:text-2xl font-bold text-white">{formatCurrency(totalValue)}</p>
            <p className="text-gray-500 text-xs mt-1">{formatBtc(totalBtc)}</p>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
            <p className="text-gray-400 text-xs mb-1">Profit / Perte</p>
            <p className={`text-xl sm:text-2xl font-bold ${totalProfitLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {totalProfitLoss >= 0 ? '+' : ''}{formatCurrency(totalProfitLoss)}
            </p>
            <p className={`text-xs mt-1 ${totalProfitLoss >= 0 ? 'text-green-400/70' : 'text-red-400/70'}`}>
              {totalProfitLossPercent >= 0 ? '+' : ''}{totalProfitLossPercent.toFixed(2)}%
            </p>
          </div>
        </div>

        {/* Section positions */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-300">Mes positions</h2>
            <button 
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Ajouter
            </button>
          </div>

          {/* Formulaire d'ajout */}
          {showAddForm && (
            <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 space-y-3">
              <input
                type="text"
                placeholder="Nom (ex: Ledger, Binance...)"
                value={newHolding.name}
                onChange={(e) => setNewHolding({...newHolding, name: e.target.value})}
                className="w-full bg-gray-700 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  step="0.00000001"
                  placeholder="Quantité BTC"
                  value={newHolding.amount}
                  onChange={(e) => setNewHolding({...newHolding, amount: e.target.value})}
                  className="bg-gray-700 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <input
                  type="number"
                  placeholder={`Prix d'achat (${currencySymbol})`}
                  value={newHolding.buyPrice}
                  onChange={(e) => setNewHolding({...newHolding, buyPrice: e.target.value})}
                  className="bg-gray-700 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={addHolding} 
                  className="flex-1 bg-green-600 hover:bg-green-700 rounded-lg py-3 text-sm font-medium transition-colors"
                >
                  Ajouter
                </button>
                <button 
                  onClick={() => setShowAddForm(false)} 
                  className="flex-1 bg-gray-700 hover:bg-gray-600 rounded-lg py-3 text-sm font-medium transition-colors"
                >
                  Annuler
                </button>
              </div>
            </div>
          )}

          {/* Liste des positions - Cards empilées */}
          <div className="space-y-2">
            {holdings.map((holding) => {
              const buyPrice = currency === 'usd' ? holding.buyPriceUsd : holding.buyPriceEur;
              const currentValue = btcPrice ? holding.amount * btcPrice : 0;
              const invested = holding.amount * buyPrice;
              const profitLoss = currentValue - invested;
              const profitLossPercent = invested > 0 ? ((profitLoss / invested) * 100) : 0;
              const isExpanded = expandedId === holding.id;
              const isEditing = editingId === holding.id;

              return (
                <div 
                  key={holding.id} 
                  className="bg-gray-800/50 rounded-xl border border-gray-700/50 overflow-hidden"
                >
                  {isEditing ? (
                    <div className="p-4 space-y-3">
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                        className="w-full bg-gray-700 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                        placeholder="Nom"
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="number"
                          step="0.00000001"
                          value={editForm.amount}
                          onChange={(e) => setEditForm({...editForm, amount: e.target.value})}
                          className="bg-gray-700 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                          placeholder="Quantité"
                        />
                        <input
                          type="number"
                          value={editForm.buyPrice}
                          onChange={(e) => setEditForm({...editForm, buyPrice: e.target.value})}
                          className="bg-gray-700 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                          placeholder={`Prix (${currencySymbol})`}
                        />
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={saveEdit} 
                          className="flex-1 bg-green-600 hover:bg-green-700 rounded-lg py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2"
                        >
                          <Check className="w-4 h-4" />
                          Sauvegarder
                        </button>
                        <button 
                          onClick={() => setEditingId(null)} 
                          className="flex-1 bg-gray-700 hover:bg-gray-600 rounded-lg py-3 text-sm font-medium transition-colors"
                        >
                          Annuler
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Ligne principale - toujours visible */}
                      <button 
                        onClick={() => toggleExpand(holding.id)}
                        className="w-full p-4 flex items-center justify-between hover:bg-gray-700/30 transition-colors"
                      >
                        <div className="text-left">
                          <p className="font-medium">{holding.name}</p>
                          <p className="text-gray-400 text-sm">{formatBtc(holding.amount)}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="font-semibold">{formatCurrency(currentValue)}</p>
                            <p className={`text-sm ${profitLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {profitLoss >= 0 ? '+' : ''}{profitLossPercent.toFixed(1)}%
                            </p>
                          </div>
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5 text-gray-500" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-500" />
                          )}
                        </div>
                      </button>

                      {/* Détails - visible quand expanded */}
                      {isExpanded && (
                        <div className="px-4 pb-4 pt-0 border-t border-gray-700/50">
                          <div className="grid grid-cols-2 gap-4 py-3 text-sm">
                            <div>
                              <p className="text-gray-500">Prix d'achat</p>
                              <p className="font-medium">{formatCurrencyPrecise(buyPrice)}/BTC</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Investi</p>
                              <p className="font-medium">{formatCurrency(invested)}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Valeur actuelle</p>
                              <p className="font-medium">{formatCurrency(currentValue)}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Gain/Perte</p>
                              <p className={`font-medium ${profitLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {profitLoss >= 0 ? '+' : ''}{formatCurrency(profitLoss)}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2 pt-2">
                            <button 
                              onClick={() => startEdit(holding)}
                              className="flex-1 bg-gray-700 hover:bg-gray-600 rounded-lg py-2.5 text-sm font-medium transition-colors flex items-center justify-center gap-2"
                            >
                              <Edit2 className="w-4 h-4" />
                              Modifier
                            </button>
                            <button 
                              onClick={() => deleteHolding(holding.id)}
                              className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg py-2.5 text-sm font-medium transition-colors flex items-center justify-center gap-2"
                            >
                              <Trash2 className="w-4 h-4" />
                              Supprimer
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {holdings.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Bitcoin className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Aucune position</p>
              <p className="text-sm">Clique sur "Ajouter" pour commencer</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-gray-600 text-xs pt-4 pb-8">
          Prix via CoinGecko / Coinbase • MAJ auto 10s
        </p>
      </main>
    </div>
  );
}
