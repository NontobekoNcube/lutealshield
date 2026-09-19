import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    build: {
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html'),
          onboarding: path.resolve(__dirname, 'onboarding.html'),
          plan: path.resolve(__dirname, 'plan.html'),
          pocket: path.resolve(__dirname, 'pocket.html'),
          bloomy: path.resolve(__dirname, 'bloomy.html'),
          support: path.resolve(__dirname, 'support.html'),
          settings: path.resolve(__dirname, 'settings.html'),
        },
      },
    },
    plugins: [
      {
        name: 'bloomy-mock-api',
        configureServer(server) {
          server.middlewares.use('/api/bloomy', (req, res) => {
            if (req.method === 'POST') {
              let body = '';
              req.on('data', chunk => { body += chunk; });
              req.on('end', () => {
                try {
                  const data = JSON.parse(body || '{}');
                  const userMsg = (data.message || '').toLowerCase();
                  const symptoms = data.user_symptoms || [];
                  const vault = data.vault_entries || [];
                  const zone = data.current_zone || 'green';

                  let response = "I hear you, and I am right here with you. Take a soft, gentle breath with me.";
                  if (userMsg.includes('quit') || userMsg.includes('job') || userMsg.includes('break up') || userMsg.includes('cancel')) {
                    response = "I hear how urgent and overwhelming everything feels right now. Remember your 72-Hour Luteal Rule: your steady-self made a covenant to wait 72 hours before making irreversible decisions. The storm is chemical, not factual. Would you like me to hold off this decision with you for 72 hours?";
                  } else if (userMsg.includes('everyone') || userMsg.includes('hate') || userMsg.includes('dislike')) {
                    response = "That phantom feeling that 'everyone secretly dislikes me' is a textbook luteal sensitivity trigger. Your nervous system is raw right now. Remember: your brain is dealing with a severe chemical dip, not a sudden truth.";
                  } else if (zone === 'red') {
                    response = `Holding space for you in this Red Zone day. Your brain is navigating a steep hormonal shift, which amplifies ${symptoms.slice(0, 2).join(' and ') || 'emotional overwhelm'}. You have ${vault.length || 6} anchors safely stored in your Affirmations Pocket. You will get through this.`;
                  } else {
                    response = `I'm listening softly. Your PMDD profile is active and your anchors are ready. What is one small, sensory comfort you can give yourself in this moment?`;
                  }

                  res.setHeader('Content-Type', 'application/json');
                  res.writeHead(200);
                  res.end(JSON.stringify({
                    status: 'ok',
                    response: response,
                    grounding_prompt: "Activate 72h Decision Buffer"
                  }));
                } catch {
                  res.setHeader('Content-Type', 'application/json');
                  res.writeHead(200);
                  res.end(JSON.stringify({
                    response: "Bloomy is resting 💜 Look through your Affirmations Pocket while you wait."
                  }));
                }
              });
            } else {
              res.writeHead(405);
              res.end();
            }
          });
        },
      },
    ],
  };
});
