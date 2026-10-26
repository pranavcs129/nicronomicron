/* ==========================================================================
   WEBGL DEMONIC EMBER ENTITY SHADER & PARTICLE ENGINE
   Based on the cinematic living Necronomicon reference scene shader.
   Animates smoke, pulsing demonic eyes, veins, book light, candles, and sparks.
   ========================================================================== */

import { audio } from './audio.js';

export class EmberEntityRenderer {
  constructor(glCanvasId, fxCanvasId) {
    this.gc = document.getElementById(glCanvasId);
    this.fc = document.getElementById(fxCanvasId);
    this.gl = this.gc ? (this.gc.getContext('webgl') || this.gc.getContext('experimental-webgl')) : null;
    this.fx = this.fc ? this.fc.getContext('2d') : null;
    
    this.IW = 1672;
    this.IH = 941;
    this.ready = false;
    this.tex = null;
    this.pr = null;
    this.U = {};
    
    this.E = {
      state: 'idle',
      e: 0,
      t: 0,
      lv: 0,
      pv: 0,
      bl: 0,
      blink: 0,
      nb: 3.5,
      px: 0,
      py: 0,
      tx: 0,
      ty: 0
    };
    
    this.BASE = { idle: 0.12, listening: 0.45, thinking: 0.75, speaking: 1.0 };
    this.sparks = [];
    this.sa = 0;
    this.sparkCanvas = null;
    this.running = false;
  }

  init(imageSrc = 'assets/main ui/talking ui/ref ui.png') {
    if (!this.gl || !this.fx) {
      console.warn('WebGL/Canvas not available for Ember Entity');
      return;
    }

    const VS = `attribute vec2 a;varying vec2 uv;void main(){uv=(a+1.)*.5;uv.y=1.-uv.y;gl_Position=vec4(a,0.,1.);}`;
    const FS = `precision highp float;
varying vec2 uv;
uniform sampler2D T;
uniform vec2 R,O,P;
uniform float S,t,e,k,bl,mo;
uniform vec2 C[7];
const vec2 E0=vec2(800.,218.)/vec2(1672.,941.);
const vec2 E1=vec2(878.,215.)/vec2(1672.,941.);
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1.,0.)),f.x),mix(h(i+vec2(0.,1.)),h(i+vec2(1.)),f.x),f.y);}
void main(){
  vec2 p=(gl_FragCoord.xy-O)/S;
  vec2 uv=p/vec2(1672.,941.);
  if(uv.x<0.||uv.x>1.||uv.y<0.||uv.y>1.){gl_FragColor=vec4(0.015,0.004,0.004,1.);return;}
  vec2 asp=vec2(1672./941.,1.);
  float dF=smoothstep(.65,.0,length((uv-vec2(.5,.26))*asp));
  vec2 off=vec2(n(uv*6.+vec2(0.,-t*.6)),n(uv*6.+vec2(4.3,-t*.7+.8)))-.5;
  vec2 dis=off*(.008+.022*e)*dF*mo;
  vec3 c=texture2D(T,uv+dis).rgb;
  c=mix(c,c*.15,bl*em(uv));
  float red=max(0.,c.r-max(c.g,c.b)*1.2);
  float flick=.55+.45*n(uv*vec2(34.,22.)+vec2(0.,-t*1.8));
  float fl=smoothstep(.62,.74,uv.y);
  float wave=.5+.5*sin(length((uv-vec2(.5,.75))*vec2(1.78,3.))*30.-t*(2.+e*6.));
  float boost=e*(1.5*flick*(1.-fl)+1.2*fl*wave);
  c+=vec3(1.,.22,.08)*red*boost*1.4;
  float g0=length((uv-E0)*asp),g1=length((uv-E1)*asp),ew=.028+.05*e;
  c+=vec3(1.,.26,.09)*(exp(-pow(g0/ew,2.))+exp(-pow(g1/ew,2.)))*(.18+.8*e)*k*(1.-bl);
  float bg=exp(-pow(length((uv-vec2(.499,.53))*asp)/(.15+.13*e),2.));
  c+=vec3(1.,.28,.12)*bg*(.03+.4*e)*(.82+.18*sin(t*2.1));
  for(int i=0;i<7;i++){
    float r=length((uv-C[i])*asp);
    float f=.85+.15*sin(t*11.+float(i)*3.)+.12*n(vec2(t*6.,float(i)));
    c+=vec3(1.,.45,.15)*exp(-r*r/(.011+.004*e))*(.07+.09*e)*f;
  }
  gl_FragColor=vec4(c,1.);
}
float em(vec2 u){
  vec2 asp=vec2(1672./941.,1.);
  return exp(-pow(min(length((u-E0)*asp),length((u-E1)*asp))/.03,2.));
}`;

    const sh = (type, src) => {
      const s = this.gl.createShader(type);
      this.gl.shaderSource(s, src);
      this.gl.compileShader(s);
      return s;
    };

    this.pr = this.gl.createProgram();
    this.gl.attachShader(this.pr, sh(this.gl.VERTEX_SHADER, VS));
    this.gl.attachShader(this.pr, sh(this.gl.FRAGMENT_SHADER, FS));
    this.gl.linkProgram(this.pr);

    if (this.gl.getProgramParameter(this.pr, this.gl.LINK_STATUS)) {
      this.gl.useProgram(this.pr);
      const b = this.gl.createBuffer();
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, b);
      this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), this.gl.STATIC_DRAW);
      const a = this.gl.getAttribLocation(this.pr, 'a');
      this.gl.enableVertexAttribArray(a);
      this.gl.vertexAttribPointer(a, 2, this.gl.FLOAT, false, 0, 0);

      ['T', 'R', 'O', 'P', 'S', 't', 'e', 'k', 'bl', 'mo', 'C'].forEach(n => {
        this.U[n] = this.gl.getUniformLocation(this.pr, n);
      });

      this.gl.uniform2fv(this.U.C, new Float32Array([157, 595, 405, 483, 1259, 497, 1325, 503, 1457, 590, 216, 795, 1273, 822].map((v, i) => v / (i % 2 ? this.IH : this.IW))));
    } else {
      console.warn('Ember shader link error');
    }

    // Spark sprite generator
    this.sparkCanvas = document.createElement('canvas');
    this.sparkCanvas.width = this.sparkCanvas.height = 32;
    const g = this.sparkCanvas.getContext('2d');
    const r = g.createRadialGradient(16, 16, 0, 16, 16, 16);
    r.addColorStop(0, 'rgba(255,200,140,1)');
    r.addColorStop(0.25, 'rgba(255,90,30,0.7)');
    r.addColorStop(1, 'rgba(255,40,10,0)');
    g.fillStyle = r;
    g.fillRect(0, 0, 32, 32);

    // Initial sparks
    for (let i = 0; i < 45; i++) {
      this.addSpark(false);
      if (this.sparks[i]) this.sparks[i].l = Math.random() * this.sparks[i].m;
    }

    // Load texture
    const im = new Image();
    im.onload = () => {
      this.tex = this.gl.createTexture();
      this.gl.bindTexture(this.gl.TEXTURE_2D, this.tex);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
      this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGB, this.gl.RGB, this.gl.UNSIGNED_BYTE, im);
      this.ready = true;
    };
    im.src = imageSrc;

    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.startLoop();
  }

  resize() {
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.vw = window.innerWidth;
    this.vh = window.innerHeight;
    [this.gc, this.fc].forEach(c => {
      if (c) {
        c.width = this.vw * this.dpr;
        c.height = this.vh * this.dpr;
      }
    });
    this.S = Math.max(this.vw / this.IW, this.vh / this.IH);
    this.ox = (this.vw - this.IW * this.S) / 2;
    this.oy = (this.vh - this.IH * this.S) / 2;
    if (this.gl) this.gl.viewport(0, 0, this.gc.width, this.gc.height);
  }

  addSpark(burst = false) {
    const origins = [[835, 520], [157, 595], [405, 483], [1259, 497], [1457, 590]];
    const rnd = (a, b) => a + Math.random() * (b - a);
    const o = burst ? [835 + rnd(-110, 110), rnd(490, 540)] : origins[Math.floor(Math.random() * origins.length)];
    this.sparks.push({
      x: o[0] + rnd(-6, 6),
      y: o[1] + (burst ? 0 : rnd(-10, 0)),
      vx: rnd(-14, 14),
      vy: -rnd(25, 90) * (burst ? 1.4 : 0.6),
      l: 0,
      m: rnd(1.6, 4.5),
      s: rnd(0.5, 1.5),
      p: rnd(0, 6)
    });
  }

  setState(state) {
    if (this.BASE[state] !== undefined) {
      this.E.state = state;
    }
  }

  pulse(val = 0.6) {
    this.E.pv = Math.min(1.2, this.E.pv + val);
  }

  update(dt) {
    this.E.t += dt;
    this.E.pv *= Math.pow(0.02, dt);
    const th = this.E.state === 'thinking' ? Math.sin(this.E.t * 6) * 0.06 : 0;
    const tgt = Math.min(1.15, this.BASE[this.E.state] + th + this.E.lv * 0.5 + this.E.pv * 0.55);
    this.E.e += (tgt - this.E.e) * Math.min(1, dt * 7);

    // Blinking
    this.E.nb -= dt;
    if (this.E.nb < 0) {
      this.E.bl = 1;
      this.E.nb = 2.5 + Math.random() * 4;
    }
    this.E.blink = this.E.bl > 0 ? Math.sin(Math.PI * (1 - this.E.bl)) : 0;
    this.E.bl = Math.max(0, this.E.bl - dt * 6);

    // Sparks
    this.sa += (10 + this.E.e * 60) * dt;
    while (this.sa > 1) {
      this.addSpark(Math.random() < 0.5 + this.E.e * 0.4);
      this.sa--;
    }
    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const p = this.sparks[i];
      p.l += dt;
      if (p.l > p.m || this.sparks.length > 220) {
        this.sparks.splice(i, 1);
        continue;
      }
      p.x += (p.vx + Math.sin(this.E.t * 2 + p.p) * 10) * dt;
      p.y += p.vy * dt;
    }
  }

  draw() {
    if (this.gl && this.ready) {
      this.gl.uniform1i(this.U.T, 0);
      this.gl.uniform2f(this.U.R, this.gc.width, this.gc.height);
      this.gl.uniform2f(this.U.O, this.ox * this.dpr, this.oy * this.dpr);
      this.gl.uniform1f(this.U.S, this.S * this.dpr);
      this.gl.uniform1f(this.U.t, this.E.t);
      this.gl.uniform1f(this.U.e, this.E.e);
      this.gl.uniform1f(this.U.k, 1 + (this.E.state === 'thinking' ? Math.sin(this.E.t * 6) * 0.25 : 0));
      this.gl.uniform1f(this.U.bl, this.E.blink);
      this.gl.uniform1f(this.U.mo, 1.0);
      this.gl.uniform2f(this.U.P, this.E.px, this.E.py);
      this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
    }

    if (this.fx && this.sparkCanvas) {
      this.fx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      this.fx.clearRect(0, 0, this.vw, this.vh);
      this.fx.globalCompositeOperation = 'lighter';
      for (const p of this.sparks) {
        const u = p.l / p.m;
        const a = Math.sin(Math.PI * u) * (0.5 + Math.abs(Math.sin(this.E.t * 3 + p.p)) * 0.5) * (0.45 + this.E.e * 0.7);
        const r = (3 + p.s * 5) * this.S;
        this.fx.globalAlpha = Math.min(1, Math.max(0, a));
        this.fx.drawImage(this.sparkCanvas, p.x * this.S + this.ox - r, p.y * this.S + this.oy - r, r * 2, r * 2);
      }
      this.fx.globalAlpha = 1;
    }
  }

  startLoop() {
    this.running = true;
    let last = performance.now();
    const frame = (now) => {
      if (!this.running) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      this.update(dt);
      this.draw();
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }
}
