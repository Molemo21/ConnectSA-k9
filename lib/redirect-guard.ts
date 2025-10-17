/**
 * Redirect Guard - Prevents redirect loops and tracks redirect attempts
 * This utility helps debug and prevent infinite redirect loops
 */

interface RedirectAttempt {
  timestamp: number;
  from: string;
  to: string;
  reason: string;
  stack?: string;
}

class RedirectGuard {
  private static instance: RedirectGuard;
  private redirectHistory: RedirectAttempt[] = [];
  private maxHistorySize = 10;
  private redirectCooldown = 2000; // 2 seconds
  private lastRedirectTime = 0;

  private constructor() {
    // Initialize persistent logging
    this.initializePersistentLogging();
  }

  static getInstance(): RedirectGuard {
    if (!RedirectGuard.instance) {
      RedirectGuard.instance = new RedirectGuard();
    }
    return RedirectGuard.instance;
  }

  private initializePersistentLogging() {
    // Store redirect history in sessionStorage so it persists across page changes
    if (typeof window !== 'undefined') {
      try {
        const stored = sessionStorage.getItem('redirect-history');
        if (stored) {
          this.redirectHistory = JSON.parse(stored);
        }
      } catch (error) {
        console.error('Failed to load redirect history:', error);
      }
    }
  }

  private saveHistory() {
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem('redirect-history', JSON.stringify(this.redirectHistory));
      } catch (error) {
        console.error('Failed to save redirect history:', error);
      }
    }
  }

  private logToServer(level: 'info' | 'warn' | 'error', message: string, data?: any) {
    // Send logs to server for persistent tracking
    if (typeof window !== 'undefined') {
      fetch('/api/client-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level,
          message,
          data: {
            ...data,
            url: window.location.href,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent
          }
        }),
      }).catch(error => {
        console.error('Failed to send log to server:', error);
      });
    }
  }

  /**
   * Check if a redirect should be allowed
   * Returns true if redirect is allowed, false if it should be blocked
   */
  shouldAllowRedirect(to: string, reason: string): boolean {
    const now = Date.now();
    const currentPath = window.location.pathname;

    // Check cooldown period
    if (now - this.lastRedirectTime < this.redirectCooldown) {
      console.warn('🚫 REDIRECT BLOCKED: Too soon after last redirect', {
        to,
        reason,
        timeSinceLastRedirect: now - this.lastRedirectTime
      });
      
      this.logToServer('warn', 'Redirect blocked - cooldown period', {
        to,
        reason,
        currentPath,
        timeSinceLastRedirect: now - this.lastRedirectTime
      });
      
      return false;
    }

    // Check for redirect loops
    const recentRedirects = this.redirectHistory.slice(-3);
    const loopDetected = recentRedirects.some(attempt => 
      attempt.from === to && attempt.to === currentPath
    );

    if (loopDetected) {
      console.error('🚫 REDIRECT BLOCKED: Loop detected', {
        to,
        reason,
        currentPath,
        recentRedirects: recentRedirects.map(r => `${r.from} -> ${r.to}`)
      });
      
      this.logToServer('error', 'Redirect blocked - loop detected', {
        to,
        reason,
        currentPath,
        recentRedirects
      });
      
      return false;
    }

    // Check for excessive redirects to login
    const loginRedirects = this.redirectHistory.filter(attempt => 
      attempt.to === '/login'
    ).slice(-5);

    if (loginRedirects.length >= 3) {
      console.error('🚫 REDIRECT BLOCKED: Too many login redirects', {
        to,
        reason,
        loginRedirectCount: loginRedirects.length
      });
      
      this.logToServer('error', 'Redirect blocked - too many login redirects', {
        to,
        reason,
        loginRedirectCount: loginRedirects.length,
        loginRedirects: loginRedirects.map(r => ({ from: r.from, reason: r.reason }))
      });
      
      return false;
    }

    return true;
  }

  /**
   * Record a redirect attempt
   */
  recordRedirect(to: string, reason: string): void {
    const now = Date.now();
    const currentPath = window.location.pathname;

    const attempt: RedirectAttempt = {
      timestamp: now,
      from: currentPath,
      to,
      reason,
      stack: new Error().stack
    };

    this.redirectHistory.push(attempt);
    this.lastRedirectTime = now;

    // Keep only recent history
    if (this.redirectHistory.length > this.maxHistorySize) {
      this.redirectHistory = this.redirectHistory.slice(-this.maxHistorySize);
    }

    this.saveHistory();

    console.log('🔄 REDIRECT RECORDED:', {
      from: currentPath,
      to,
      reason,
      timestamp: new Date(now).toISOString()
    });

    this.logToServer('info', 'Redirect recorded', {
      from: currentPath,
      to,
      reason
    });
  }

  /**
   * Get redirect history for debugging
   */
  getHistory(): RedirectAttempt[] {
    return [...this.redirectHistory];
  }

  /**
   * Clear redirect history
   */
  clearHistory(): void {
    this.redirectHistory = [];
    this.lastRedirectTime = 0;
    this.saveHistory();
    console.log('🧹 Redirect history cleared');
  }

  /**
   * Safe redirect function that checks before redirecting
   */
  safeRedirect(to: string, reason: string): boolean {
    if (!this.shouldAllowRedirect(to, reason)) {
      return false;
    }

    this.recordRedirect(to, reason);
    
    // Use different redirect methods based on the target
    if (to === '/login') {
      // For login redirects, use replace to avoid back button issues
      window.location.replace(to);
    } else {
      // For other redirects, use href
      window.location.href = to;
    }
    
    return true;
  }
}

// Export singleton instance
export const redirectGuard = RedirectGuard.getInstance();

// Export utility functions
export const safeRedirect = (to: string, reason: string) => redirectGuard.safeRedirect(to, reason);
export const getRedirectHistory = () => redirectGuard.getHistory();
export const clearRedirectHistory = () => redirectGuard.clearHistory();
