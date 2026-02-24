import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../utils/supabaseClient'
import { formatCurrency } from '../utils/currency'
import styles from './Wallet.module.css'

export const Wallet = () => {
  const { profile, loading: authLoading } = useAuth()
  const [wallet, setWallet] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [topUpAmount, setTopUpAmount] = useState('')
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [message, setMessage] = useState('')

  const loadWalletData = useCallback(async () => {
    if (!profile) {
      setLoading(false)
      return
    }

    try {
      const { data: walletData, error: walletError } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', profile.id)
        .single()

      if (walletError) throw walletError
      setWallet(walletData)

      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(20)

      if (transactionsError) throw transactionsError
      setTransactions(transactionsData || [])
    } catch (error) {
      console.error('Error loading wallet data:', error)
    } finally {
      setLoading(false)
    }
  }, [profile])

  useEffect(() => {
    if (authLoading) {
      return
    }

    if (profile) {
      loadWalletData()
    } else {
      setLoading(false)
    }
  }, [profile, loadWalletData, authLoading])

  const handleTopUp = async (e) => {
    e.preventDefault()
    if (!topUpAmount || parseFloat(topUpAmount) <= 0) {
      setMessage('Please enter a valid amount')
      return
    }

    setProcessing(true)
    setMessage('')

    try {
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert([
          {
            user_id: profile.id,
            amount: parseFloat(topUpAmount),
            type: 'top_up',
            description: 'Wallet top-up',
          },
        ])
        .select()
        .single()

      if (transactionError) throw transactionError

      const newBalance = (wallet?.balance || 0) + parseFloat(topUpAmount)
      const { error: updateError } = await supabase
        .from('wallets')
        .update({ balance: newBalance })
        .eq('user_id', profile.id)

      if (updateError) throw updateError

      setTopUpAmount('')
      setMessage('Top-up successful!')
      loadWalletData()
    } catch (error) {
      console.error('Error processing top-up:', error)
      setMessage('Failed to process top-up. Please try again.')
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return <div className={styles.loading}>Loading wallet...</div>
  }

  return (
    <div className={styles.container}>
      <section className={styles.hero}>
        <div>
          <p className={styles.heroBadge}>Wallet</p>
          <h1>Manage your project budget</h1>
          <p>Secure top-ups, crystal-clear history, and instant balance visibility.</p>
        </div>
        <div className={styles.balanceBadge}>
          <span>Current balance</span>
          <strong>{formatCurrency(wallet?.balance || 0)}</strong>
        </div>
      </section>

      <section className={styles.quickStats}>
        <div className={`${styles.quickCard} ${styles.quickAccentPrimary}`}>
          <div>
            <p>Completed Payments</p>
            <strong>
              {
                transactions.filter((t) => t.type === 'payment_received' || t.type === 'top_up')
                  .length
              }
            </strong>
          </div>
          <span>✔︎</span>
        </div>
        <div className={`${styles.quickCard} ${styles.quickAccentGrey}`}>
          <div>
            <p>Pending Actions</p>
            <strong>
              {
                transactions.filter((t) => t.type === 'payment_sent' || t.type === 'withdrawal')
                  .length
              }
            </strong>
          </div>
          <span>⏳</span>
        </div>
        <div className={`${styles.quickCard} ${styles.quickAccentGreen}`}>
          <div>
            <p>Autopay Ready</p>
            <strong>On</strong>
          </div>
          <span>⚡️</span>
        </div>
      </section>

      <section className={styles.walletGrid}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <h2>Wallet Snapshot</h2>
              <p>Real‑time overview of your account</p>
            </div>
            <div className={styles.balancePill}>{formatCurrency(wallet?.balance || 0)}</div>
          </div>
          <div className={styles.balanceInfo}>
            <div>
              <p>Last updated</p>
              <strong>{new Date().toLocaleString()}</strong>
            </div>
            <div>
              <p>Account ID</p>
              <strong>{wallet?.id?.slice(0, 8).toUpperCase()}</strong>
            </div>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <h2>Top up wallet</h2>
              <p>Boost your balance instantly</p>
            </div>
          </div>
          <form onSubmit={handleTopUp} className={styles.topUpForm}>
            <div className={styles.amountField}>
              <span>UGX</span>
              <input
                type="number"
                value={topUpAmount}
                onChange={(e) => setTopUpAmount(e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
                required
              />
            </div>
            <div className={styles.topUpActions}>
              <button type="button" onClick={() => setTopUpAmount('50000')}>
                +UGX 50,000
              </button>
              <button type="button" onClick={() => setTopUpAmount('100000')}>
                +UGX 100,000
              </button>
              <button type="button" onClick={() => setTopUpAmount('250000')}>
                +UGX 250,000
              </button>
            </div>
            <button type="submit" disabled={processing} className={styles.primaryBtn}>
              {processing ? 'Processing...' : 'Add funds'}
            </button>
            {message && (
              <div className={message.includes('success') ? styles.success : styles.error}>
                {message}
              </div>
            )}
          </form>
        </div>
      </section>

      <section className={styles.transactionsSection}>
        <div className={styles.transactionsHeader}>
          <div>
            <h2>Recent activity</h2>
            <p>A complete log of top-ups, releases, and payouts.</p>
          </div>
          <button type="button" className={styles.filterButton}>
            Filter ▾
          </button>
        </div>

        {transactions.length === 0 ? (
          <div className={styles.empty}>No transactions yet.</div>
        ) : (
          <div className={styles.transactionTimeline}>
            {transactions.map((transaction, index) => (
              <div key={transaction.id} className={styles.timelineRow}>
                <div className={styles.timelineStatus}>
                  <span
                    className={`${styles.timelineDot} ${
                      transaction.type === 'top_up' || transaction.type === 'payment_received'
                        ? styles.dotPositive
                        : styles.dotNegative
                    }`}
                  />
                  {index !== transactions.length - 1 && <span className={styles.timelineConnector} />}
                </div>
                <div className={styles.timelineCard}>
                  <div className={styles.timelineCardHeader}>
                    <div>
                      <h4>{transaction.description || transaction.type}</h4>
                      <p>{new Date(transaction.created_at).toLocaleString()}</p>
                    </div>
                    <span
                      className={
                        transaction.type === 'top_up' || transaction.type === 'payment_received'
                          ? styles.amountPositive
                          : styles.amountNegative
                      }
                    >
                      {transaction.type === 'top_up' || transaction.type === 'payment_received' ? '+' : '-'}
                      {formatCurrency(Math.abs(transaction.amount))}
                    </span>
                  </div>
                  <div className={styles.timelineCardBody}>
                    <p>Ref: {transaction.id.slice(0, 10).toUpperCase()}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

