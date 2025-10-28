import { useEffect } from 'react';

const AntiDevTools = () => {
  useEffect(() => {
    // CONFIGURAÇÃO
    const redirectUrl = 'https://www.youtube.com/watch?v=tZzWdKc6-lI';
    const checkInterval = 1000; // 1 segundo entre as checagens
    const timeThreshold = 120; // margem para detectar pausa do debugger

    // --- AÇÃO QUANDO DETECTA ---
    const triggerTrap = () => {
      console.clear();
      window.location.replace(redirectUrl);
    };

    // --- DETECÇÃO DE ATALHOS ---
    const handleKeydown = (e) => {
      const forbiddenKeys = [
        'F12',
        'I', // Ctrl+Shift+I
        'J', // Ctrl+Shift+J
        'C', // Ctrl+Shift+C
        'U', // Ctrl+U
      ];

      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && forbiddenKeys.includes(e.key)) ||
        (e.ctrlKey && e.key === 'U')
      ) {
        e.preventDefault();
        triggerTrap();
      }
    };

    const handleContextMenu = (e) => {
      e.preventDefault();
      triggerTrap();
    };

    // --- DETECÇÃO DE DEBUGGER ---
    const detectDebugger = () => {
      const start = performance.now();
      debugger; // pausa se devtools estiver aberto
      const end = performance.now();

      if (end - start > timeThreshold) {
        triggerTrap();
      }
    };

    // --- DETECÇÃO DE TAMANHO DA JANELA ---
    const detectResize = () => {
      const threshold = 160;
      if (
        window.outerWidth - window.innerWidth > threshold ||
        window.outerHeight - window.innerHeight > threshold
      ) {
        triggerTrap();
      }
    };

    // --- DETECÇÃO DE INSPEÇÃO DO CONSOLE ---
    const detectConsole = () => {
      const trap = { check: false };
      Object.defineProperty(trap, 'check', {
        get() {
          triggerTrap();
          return true;
        },
      });
      console.log(trap);
      setTimeout(console.clear, 150);
    };

    // --- LOOP DE VERIFICAÇÃO ---
    const runAllChecks = () => {
      detectDebugger();
      detectResize();
      detectConsole();
    };

    // EVENTOS E INTERVALOS
    window.addEventListener('keydown', handleKeydown);
    window.addEventListener('contextmenu', handleContextMenu);

    const intervalId = setInterval(runAllChecks, checkInterval);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('keydown', handleKeydown);
      window.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);

  return null;
};

export default AntiDevTools;
