/**
 * Sino tibetano sintetizado — parciais levemente inarmônicos (como uma tigela cantante),
 * ataque suave e ressonância longa, tocado 3 vezes em sequência (como um sino de
 * meditação). Avisa que a fase acabou sem soar como alarme.
 */
export function playBeep() {
  try {
    const AudioCtx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    const duracao = 4.2;
    const numToques = 3;
    const intervaloToques = 1.3;

    const parciais = [
      { freq: 220, gain: 0.32 },
      { freq: 220 * 2.0, gain: 0.16 },
      { freq: 220 * 2.76, gain: 0.11 },
      { freq: 220 * 3.4, gain: 0.07 },
      { freq: 220 * 4.5, gain: 0.04 },
    ];

    for (let toque = 0; toque < numToques; toque++) {
      const inicio = ctx.currentTime + toque * intervaloToques;

      const masterGain = ctx.createGain();
      masterGain.gain.value = 0.5;
      masterGain.connect(ctx.destination);

      parciais.forEach(({ freq, gain }) => {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = freq;

        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, inicio);
        g.gain.exponentialRampToValueAtTime(gain, inicio + 0.06);
        g.gain.exponentialRampToValueAtTime(0.0001, inicio + duracao);

        osc.connect(g);
        g.connect(masterGain);
        osc.start(inicio);
        osc.stop(inicio + duracao + 0.1);
      });
    }
  } catch {
    // ambiente sem suporte a Web Audio — segue sem som
  }
}
