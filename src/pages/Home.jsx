import { Link } from 'react-router-dom'
import { 
  Search, 
  Wrench, 
  MonitorSmartphone, 
  PenTool, 
  Briefcase, 
  ShieldCheck, 
  Star 
} from 'lucide-react'
import logoUrl from '../assets/logo.png'
import styles from './Home.module.css'

export const Home = () => {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.nav}>
          <div className={styles.logo}>
            <img src={logoUrl} alt="SkillBee Logo" className={styles.logoImage} />
            SkillBee
          </div>
          <div className={styles.authLinks}>
            <Link to="/login" className={styles.loginBtn}>Log In</Link>
            <Link to="/signup" className={styles.signupBtn}>Get Started</Link>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        {/* --- Hero Section --- */}
        <section className={styles.heroSection}>
          <div className={styles.heroContent}>
            <div className={styles.badge}>✨ Premium Marketplace</div>
            <h1 className={styles.heroTitle}>
              Find <span>Trusted</span> Local Pros in Minutes.
            </h1>
            <p className={styles.heroSubtitle}>
              Connect with skilled, background-checked professionals for all your home and life needs. SkillBee makes hiring easy, reliable, and secure.
            </p>
            
            <div className={styles.searchBar}>
              <Search className={styles.searchIcon} size={20} />
              <input 
                type="text" 
                placeholder="What service do you need?" 
                className={styles.searchInput}
              />
              <button className={styles.searchBtn}>Search</button>
            </div>

            <div className={styles.trustIndicators}>
              <div className={styles.trustItem}>
                <ShieldCheck size={18} className={styles.trustIcon} />
                <span>Verified Pros</span>
              </div>
              <div className={styles.trustItem}>
                <Star size={18} className={styles.trustIcon} />
                <span>Trusted Reviews</span>
              </div>
            </div>
          </div>
          
          <div className={styles.heroImageWrapper}>
            <img 
              src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&q=80&w=1000" 
              alt="Professional independent worker" 
              className={styles.heroImage}
            />
            <div className={styles.floatingCard}>
              <div className={styles.floatHeader}>
                <div className={styles.avatar}></div>
                <div>
                  <h4>Marcus, 30s</h4>
                  <span>Handyman Pro</span>
                </div>
              </div>
              <div className={styles.floatRating}>
                <Star size={14} fill="#F59E0B" color="#F59E0B" />
                <Star size={14} fill="#F59E0B" color="#F59E0B" />
                <Star size={14} fill="#F59E0B" color="#F59E0B" />
                <Star size={14} fill="#F59E0B" color="#F59E0B" />
                <Star size={14} fill="#F59E0B" color="#F59E0B" />
                <span className={styles.jobCount}>120+ Jobs</span>
              </div>
            </div>
          </div>
        </section>

        {/* --- Categories Section --- */}
        <section className={styles.categoriesSection}>
          <div className={styles.sectionHeader}>
            <h2>Popular Services</h2>
            <Link to="/signup" className={styles.exploreLink}>Explore All &rarr;</Link>
          </div>
          <div className={styles.categoryGrid}>
            {[
              { title: "Home Repair", desc: "Handyman, plumbing, electrical", icon: Wrench },
              { title: "Tech Support", desc: "Setup, troubleshooting, networking", icon: MonitorSmartphone },
              { title: "Design & Creative", desc: "Logos, web design, illustration", icon: PenTool },
              { title: "Business Consulting", desc: "Strategy, finance, growth", icon: Briefcase },
            ].map((cat, i) => (
              <div key={i} className={styles.categoryCard}>
                <div className={styles.iconWrapper}>
                  <cat.icon size={24} />
                </div>
                <h3>{cat.title}</h3>
                <p>{cat.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* --- How it Works --- */}
        <section className={styles.howItWorks}>
          <div className={styles.howItWorksContent}>
            <h2>How SkillBee Works</h2>
            <div className={styles.steps}>
              <div className={styles.step}>
                <div className={styles.stepNumber}>1</div>
                <h3>Describe your task</h3>
                <p>Tell us what you need help with in our simple search.</p>
              </div>
              <div className={styles.step}>
                <div className={styles.stepNumber}>2</div>
                <h3>Choose a Pro</h3>
                <p>Review profiles, read reviews, and hire the perfect fit.</p>
              </div>
              <div className={styles.step}>
                <div className={styles.stepNumber}>3</div>
                <h3>Get it done safely</h3>
                <p>Pay securely via the platform only when the job is done.</p>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.logo}>
            <img src={logoUrl} alt="SkillBee Logo" className={styles.logoImage} />
            SkillBee
          </div>
          <p>&copy; 2026 SkillBee Inc. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
