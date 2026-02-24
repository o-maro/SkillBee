import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { getTaskerWallet, getTaskerTransactions, getTaskerBookings } from '../utils/taskerApi'
import { supabase } from '../utils/supabaseClient'
import { formatCurrency } from '../utils/currency'
import styles from './TaskerWallet.module.css'

export const TaskerWallet = () => {
  const { profile, loading: authLoading } = useAuth()
  const [wallet, setWallet] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [earningsPerTask, setEarningsPerTask] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  const loadWalletData = useCallback(async () => {
    if (!profile) {
      setLoading(false)
      return
    }

    try {
      // Get wallet
      const { data: walletData, error: walletError } = await getTaskerWallet(profile.id)
      if (walletError && walletError.code !== 'PGRST116') throw walletError
      setWallet(walletData)

      // Get transactions
      const { data: transactionsData, error: transactionsError } = await getTaskerTransactions(profile.id)
      if (transactionsError) throw transactionsError
      setTransactions(transactionsData || [])

      // Get completed bookings for earnings per task
      const { data: bookings, error: bookingsError } = await getTaskerBookings(profile.id)
      if (bookingsError) throw bookingsError

      const completed = (bookings || []).filter((b) => b.status === 'completed')
      setEarningsPerTask(completed.map((b) => ({
        id: b.id,
        service_type: b.service_type,
        amount: parseFloat(b.budget) || 0,
        completed_at: b.completed_at || b.updated_at || b.created_at,
      })))
    } catch (error) {
      console.error('Error loading wallet data:', error)
      setMessage('Failed to load wallet data. Please try again.')
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

  const handleWithdraw = () => {
    // Placeholder for withdrawal functionality
    setMessage('Withdrawal feature coming soon!')
  }

  if (loading) {
    return <div className={styles.loading}>Loading wallet...</div>
  }

  const currentBalance = wallet?.balance || 0
  const totalEarnings = earningsPerTask.reduce((sum, task) => sum + task.amount, 0)

  return (
    <div className={styles.container}>
      <section className={styles.hero}>
        <div>
          <p className={styles.heroBadge}>Tasker Wallet</p>
          <h1>Manage your earnings</h1>
          <p>Track your balance, earnings per task, and transaction history.</p>
        </div>
        <div className={styles.balanceBadge}>
          <span>Current balance</span>
          <strong>{formatCurrency(currentBalance)}</strong>
        </div>
      </section>

      {message && (
        <div className={message.includes('coming soon') ? styles.info : message.includes('success') ? styles.success : styles.error}>
          {message}
        </div>
      )}

      <section className={styles.quickStats}>
        <div className={`${styles.quickCard} ${styles.quickAccentPrimary}`}>
          <div>
            <p>Total Earnings</p>
            <strong>{formatCurrency(totalEarnings)}</strong>
          </div>
          <span>💰</span>
        </div>
        <div className={`${styles.quickCard} ${styles.quickAccentGreen}`}>
          <div>
            <p>Completed Tasks</p>
            <strong>{earningsPerTask.length}</strong>
          </div>
          <span>✅</span>
        </div>
        <div className={`${styles.quickCard} ${styles.quickAccentGrey}`}>
          <div>
            <p>Transactions</p>
            <strong>{transactions.length}</strong>
          </div>
          <span>📊</span>
        </div>
      </section>

      <section className={styles.walletGrid}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <h2>Earnings per Task</h2>
              <p>Breakdown of earnings from completed tasks</p>
            </div>
          </div>
          {earningsPerTask.length === 0 ? (
            <div className={styles.empty}>No completed tasks yet.</div>
          ) : (
            <div className={styles.earningsList}>
              {earningsPerTask.map((task) => (
                <div key={task.id} className={styles.earningItem}>
                  <div>
                    <h4>{task.service_type}</h4>
                    <p>{new Date(task.completed_at).toLocaleDateString()}</p>
                  </div>
                  <span className={styles.earningAmount}>+{formatCurrency(task.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <h2>Withdraw Funds</h2>
              <p>Transfer your earnings to your bank account</p>
            </div>
          </div>
          <div className={styles.withdrawSection}>
            <p className={styles.withdrawInfo}>
              Available balance: <strong>{formatCurrency(currentBalance)}</strong>
            </p>
            <button onClick={handleWithdraw} className={styles.withdrawBtn} disabled={currentBalance <= 0}>
              {currentBalance <= 0 ? 'No funds available' : 'Withdraw Funds'}
            </button>
          </div>
        </div>
      </section>

      <section className={styles.transactionsSection}>
        <div className={styles.transactionsHeader}>
          <div>
            <h2>Transaction History</h2>
            <p>Complete log of all wallet transactions</p>
          </div>
        </div>

        {transactions.length === 0 ? (
          <div className={styles.empty}>No transactions yet.</div>
        ) : (
          <div className={styles.transactionTimeline}>
            {transactions.map((transaction, index) => (
              <div key={transaction.transaction_id || transaction.id} className={styles.timelineRow}>
                <div className={styles.timelineStatus}>
                  <span
                    className={`${styles.timelineDot} ${
                      transaction.type === 'payment_received' || transaction.type === 'earnings'
                        ? styles.dotPositive
                        : styles.dotNegative
                    }`}
                  />
                  {index !== transactions.length - 1 && <span className={styles.timelineConnector} />}
                </div>
                <div className={styles.timelineCard}>
                  <div className={styles.timelineCardHeader}>
                    <div>
                      <h4>{transaction.type?.replace('_', ' ') || 'Transaction'}</h4>
                      <p>{new Date(transaction.created_at).toLocaleString()}</p>
                    </div>
                    <span
                      className={
                        transaction.type === 'payment_received' || transaction.type === 'earnings'
                          ? styles.amountPositive
                          : styles.amountNegative
                      }
                    >
                      {transaction.type === 'payment_received' || transaction.type === 'earnings' ? '+' : '-'}
                      {formatCurrency(Math.abs(transaction.amount || 0))}
                    </span>
                  </div>
                  {transaction.meta && (
                    <div className={styles.timelineCardBody}>
                      <p>{JSON.stringify(transaction.meta)}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

