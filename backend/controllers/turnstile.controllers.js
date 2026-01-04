import dotenv from 'dotenv' ;

dotenv.config({}) ; 

const TURNSTILE_SECRET_KEY = process.env.TURNSTILE_SECRET_KEY;

// Helper function to get client IP
export const getClientIP = (req) => {
    return (
      req.headers['cf-connecting-ip'] ||
      req.headers['x-forwarded-for']?.split(',')[0] ||
      req.headers['x-real-ip'] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      'unknown'
    );
  };


export const verifyTurnstile = async (req ,res) => {
        try {
          const { token } = req.body;
      
          // Validate input
          if (!token || typeof token !== 'string') {
            return res.status(400).json({
              success: false,
              error: 'Invalid token format'
            });
          }
      
          if (token.length > 2048) {
            return res.status(400).json({
              success: false,
              error: 'Token too long'
            });
          }
      
          // Get client IP
          const clientIP = getClientIP(req);
      
          // Prepare form data for Cloudflare
          const formData = new URLSearchParams();
          formData.append('secret', TURNSTILE_SECRET_KEY);
          formData.append('response', token);
          formData.append('remoteip', clientIP);
      
          // Call Cloudflare Siteverify API
          const verifyResponse = await fetch(
            'https://challenges.cloudflare.com/turnstile/v0/siteverify',
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              body: formData.toString(),
            }
          );
      
          const result = await verifyResponse.json();
      
          // Log validation result (for debugging - remove in production)
          console.log('Turnstile validation result:', {
            success: result.success,
            hostname: result.hostname,
            challenge_ts: result.challenge_ts,
            error_codes: result['error-codes'],
            ip: clientIP
          });
      
          // Return validation result
          return res.json({
            success: result.success,
            hostname: result.hostname,
            challenge_ts: result.challenge_ts,
            'error-codes': result['error-codes'] || [],
            action: result.action,
          });
      
        } catch (error) {
          console.error('Turnstile verification error:', error);
          return res.status(500).json({
            success: false,
            error: 'Internal server error',
            'error-codes': ['internal-error']
          });
        }
      
}


export const verifyTurnstileEnhanced = async(req ,res) => {
    try {
        const { token, expectedAction, expectedHostname } = req.body;
    
        if (!token || typeof token !== 'string') {
          return res.status(400).json({
            valid: false,
            reason: 'invalid_token',
            error: 'Token is required'
          });
        }
    
        const clientIP = getClientIP(req);
    
        const formData = new URLSearchParams();
        formData.append('secret', TURNSTILE_SECRET_KEY);
        formData.append('response', token);
        formData.append('remoteip', clientIP);
    
        const verifyResponse = await fetch(
          'https://challenges.cloudflare.com/turnstile/v0/siteverify',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData.toString(),
          }
        );
    
        const validation = await verifyResponse.json();
    
        if (!validation.success) {
          return res.json({
            valid: false,
            reason: 'turnstile_failed',
            errors: validation['error-codes'],
          });
        }
    
        // Check if action matches expected value (if specified)
        if (expectedAction && validation.action !== expectedAction) {
          return res.json({
            valid: false,
            reason: 'action_mismatch',
            expected: expectedAction,
            received: validation.action,
          });
        }
    
        // Check if hostname matches expected value (if specified)
        if (expectedHostname && validation.hostname !== expectedHostname) {
          return res.json({
            valid: false,
            reason: 'hostname_mismatch',
            expected: expectedHostname,
            received: validation.hostname,
          });
        }
    
        // Check token age (warn if older than 4 minutes)
        const challengeTime = new Date(validation.challenge_ts);
        const now = new Date();
        const ageMinutes = (now.getTime() - challengeTime.getTime()) / (1000 * 60);
    
        if (ageMinutes > 4) {
          console.warn(`Token is ${ageMinutes.toFixed(1)} minutes old`);
        }
    
        return res.json({
          valid: true,
          data: validation,
          tokenAge: ageMinutes,
        });
    
      } catch (error) {
        console.error('Turnstile validation error:', error);
        return res.status(500).json({
          valid: false,
          reason: 'internal_error',
          error: error.message || 'Unknown error',
        });
      }
}