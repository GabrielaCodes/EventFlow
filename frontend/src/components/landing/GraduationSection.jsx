import { useEffect, useRef } from "react";
import img1 from "../../assets/graduation/1.jpg";
import img2 from "../../assets/graduation/2.jpg";
import img3 from "../../assets/graduation/3.jpg";
import img4 from "../../assets/graduation/4.jpg";

const images = [img1, img2, img3, img4];

const GraduationSection = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // --- UTILS (Minified) ---
    const Vector3 = {
      create: (x, y, z) => ({ x, y, z }),
      arrayForm: (v) => {
        if (!v.array) v.array = new Float32Array([v.x, v.y, v.z]);
        else { v.array[0] = v.x; v.array[1] = v.y; v.array[2] = v.z; }
        return v.array;
      }
    };
    const Matrix44 = {
      createIdentity: () => new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]),
      loadProjection: (m, aspect, vdeg, near, far) => {
        let h = near * Math.tan(vdeg * Math.PI / 180.0 * 0.5) * 2.0;
        let w = h * aspect;
        m[0] = 2.0 * near / w; m[5] = 2.0 * near / h; m[10] = -(far + near) / (far - near); m[11] = -1.0; m[14] = -2.0 * far * near / (far - near); 
        m[1] = m[2] = m[3] = m[4] = m[6] = m[7] = m[8] = m[9] = m[12] = m[13] = m[15] = 0;
      },
      loadLookAt: (m, vpos, vlook, vup) => {
        let fx = vpos.x - vlook.x, fy = vpos.y - vlook.y, fz = vpos.z - vlook.z;
        let rlf = 1.0 / Math.sqrt(fx * fx + fy * fy + fz * fz); fx *= rlf; fy *= rlf; fz *= rlf;
        let sx = vup.y * fz - vup.z * fy, sy = vup.z * fx - vup.x * fz, sz = vup.x * fy - vup.y * fx;
        let rls = 1.0 / Math.sqrt(sx * sx + sy * sy + sz * sz); sx *= rls; sy *= rls; sz *= rls;
        let ux = fy * sz - fz * sy, uy = fz * sx - fx * sz, uz = fx * sy - fy * sx;
        m[0] = sx; m[1] = ux; m[2] = fx; m[3] = 0.0; m[4] = sy; m[5] = uy; m[6] = fy; m[7] = 0.0; m[8] = sz; m[9] = uz; m[10] = fz; m[11] = 0.0;
        m[12] = -(vpos.x * sx + vpos.y * sy + vpos.z * sz); m[13] = -(vpos.x * ux + vpos.y * uy + vpos.z * uz); m[14] = -(vpos.x * fx + vpos.y * fy + vpos.z * fz); m[15] = 1.0;
      }
    };

    // --- SHADERS ---
    const sakura_point_vsh = `
    uniform mat4 uProjection; uniform mat4 uModelview; uniform vec3 uResolution; uniform vec3 uOffset; uniform vec3 uDOF; uniform vec3 uFade;
    attribute vec3 aPosition; attribute vec3 aEuler; attribute vec2 aMisc;
    varying vec3 pposition; varying float psize; varying float palpha; varying float pdist;
    varying vec3 normX; varying vec3 normY; varying vec3 normZ; varying vec3 normal;
    varying float diffuse; varying float specular; varying float rstop; varying float distancefade;
    void main(void) {
        vec4 pos = uModelview * vec4(aPosition + uOffset, 1.0);
        gl_Position = uProjection * pos;
        gl_PointSize = aMisc.x * uProjection[1][1] / -pos.z * uResolution.y * 0.5;
        pposition = pos.xyz; psize = aMisc.x; pdist = length(pos.xyz);
        palpha = smoothstep(0.0, 1.0, (pdist - 0.1) / uFade.z);
        vec3 elrsn = sin(aEuler); vec3 elrcs = cos(aEuler);
        mat3 rotx = mat3(1.0, 0.0, 0.0, 0.0, elrcs.x, elrsn.x, 0.0, -elrsn.x, elrcs.x);
        mat3 roty = mat3(elrcs.y, 0.0, -elrsn.y, 0.0, 1.0, 0.0, elrsn.y, 0.0, elrcs.y);
        mat3 rotz = mat3(elrcs.z, elrsn.z, 0.0, -elrsn.z, elrcs.z, 0.0, 0.0, 0.0, 1.0);
        mat3 rotmat = rotx * roty * rotz; normal = rotmat[2];
        mat3 trrotm = mat3(rotmat[0][0], rotmat[1][0], rotmat[2][0], rotmat[0][1], rotmat[1][1], rotmat[2][1], rotmat[0][2], rotmat[1][2], rotmat[2][2]);
        normX = trrotm[0]; normY = trrotm[1]; normZ = trrotm[2];
        const vec3 lit = vec3(0.6917144638660746, 0.6917144638660746, -0.20751433915982237);
        float tmpdfs = dot(lit, normal); if(tmpdfs < 0.0) { normal = -normal; tmpdfs = dot(lit, normal); }
        diffuse = 0.4 + tmpdfs;
        vec3 eyev = normalize(-pos.xyz);
        if(dot(eyev, normal) > 0.0) { vec3 hv = normalize(eyev + lit); specular = pow(max(dot(hv, normal), 0.0), 20.0); } else { specular = 0.0; }
        rstop = clamp((abs(pdist - uDOF.x) - uDOF.y) / uDOF.z, 0.0, 1.0);
        rstop = pow(rstop, 0.5);
        distancefade = min(1.0, exp((uFade.x - pdist) * 0.69315 / uFade.y));
    }`;

    const sakura_point_fsh = `
    #ifdef GL_ES
    precision highp float;
    #endif
    uniform vec3 uDOF; uniform vec3 uFade;
    const vec3 fadeCol = vec3(0.08, 0.03, 0.06);
    varying vec3 pposition; varying float psize; varying float palpha; varying float pdist;
    varying vec3 normX; varying vec3 normY; varying vec3 normZ; varying vec3 normal;
    varying float diffuse; varying float specular; varying float rstop; varying float distancefade;
    float ellipse(vec2 p, vec2 o, vec2 r) { vec2 lp = (p - o) / r; return length(lp) - 1.0; }
    void main(void) {
        vec3 p = vec3(gl_PointCoord - vec2(0.5, 0.5), 0.0) * 2.0;
        vec3 d = vec3(0.0, 0.0, -1.0);
        float nd = normZ.z; if(abs(nd) < 0.0001) discard;
        float np = dot(normZ, p); vec3 tp = p + d * np / nd; vec2 coord = vec2(dot(normX, tp), dot(normY, tp));
        const float flwrsn = 0.258819045102521; const float flwrcs = 0.965925826289068;
        mat2 flwrm = mat2(flwrcs, -flwrsn, flwrsn, flwrcs); vec2 flwrp = vec2(abs(coord.x), coord.y) * flwrm;
        float r; if(flwrp.x < 0.0) { r = ellipse(flwrp, vec2(0.065, 0.024) * 0.5, vec2(0.36, 0.96) * 0.5); } else { r = ellipse(flwrp, vec2(0.065, 0.024) * 0.5, vec2(0.58, 0.96) * 0.5); }
        if(r > rstop) discard;
        // GOLD COLORS
        vec3 col = mix(vec3(0.8, 0.6, 0.1), vec3(1.0, 0.9, 0.4), r); 
        float grady = mix(0.0, 1.0, pow(coord.y * 0.5 + 0.5, 0.35)); col *= vec3(1.0, grady, grady);
        col *= mix(0.8, 1.0, pow(abs(coord.x), 0.3)); col = col * diffuse + specular;
        col = mix(fadeCol, col, distancefade);
        float alpha = (rstop > 0.001)? (0.5 - r / (rstop * 2.0)) : 1.0;
        alpha = smoothstep(0.0, 1.0, alpha) * palpha;
        gl_FragColor = vec4(col * 0.5, alpha);
    }`;

    const fx_common_vsh = `uniform vec3 uResolution; attribute vec2 aPosition; varying vec2 texCoord; varying vec2 screenCoord; void main(void) { gl_Position = vec4(aPosition, 0.0, 1.0); texCoord = aPosition.xy * 0.5 + vec2(0.5, 0.5); screenCoord = aPosition.xy * vec2(uResolution.z, 1.0); }`;
    const bg_fsh = `#ifdef GL_ES
    precision highp float;
    #endif
    uniform vec2 uTimes; varying vec2 texCoord; varying vec2 screenCoord;
    void main(void) { gl_FragColor = vec4(0.086, 0.063, 0.051, 1.0); }`; // #16100d
    const fx_brightbuf_fsh = `#ifdef GL_ES
    precision highp float;
    #endif
    uniform sampler2D uSrc; uniform vec2 uDelta; varying vec2 texCoord; varying vec2 screenCoord;
    void main(void) { vec4 col = texture2D(uSrc, texCoord); gl_FragColor = vec4(col.rgb * 2.0 - vec3(0.5), 1.0); }`;
    const fx_dirblur_r4_fsh = `#ifdef GL_ES
    precision highp float;
    #endif
    uniform sampler2D uSrc; uniform vec2 uDelta; uniform vec4 uBlurDir; varying vec2 texCoord; varying vec2 screenCoord;
    void main(void) { vec4 col = texture2D(uSrc, texCoord); col = col + texture2D(uSrc, texCoord + uBlurDir.xy * uDelta); col = col + texture2D(uSrc, texCoord - uBlurDir.xy * uDelta); col = col + texture2D(uSrc, texCoord + (uBlurDir.xy + uBlurDir.zw) * uDelta); col = col + texture2D(uSrc, texCoord - (uBlurDir.xy + uBlurDir.zw) * uDelta); gl_FragColor = col / 5.0; }`;
    const pp_final_vsh = `uniform vec3 uResolution; attribute vec2 aPosition; varying vec2 texCoord; varying vec2 screenCoord; void main(void) { gl_Position = vec4(aPosition, 0.0, 1.0); texCoord = aPosition.xy * 0.5 + vec2(0.5, 0.5); screenCoord = aPosition.xy * vec2(uResolution.z, 1.0); }`;
    const pp_final_fsh = `#ifdef GL_ES
    precision highp float;
    #endif
    uniform sampler2D uSrc; uniform sampler2D uBloom; uniform vec2 uDelta; varying vec2 texCoord; varying vec2 screenCoord;
    void main(void) { vec4 srccol = texture2D(uSrc, texCoord) * 2.0; vec4 bloomcol = texture2D(uBloom, texCoord); vec4 col; col = srccol + bloomcol * (vec4(1.0) + srccol); col *= smoothstep(1.0, 0.0, pow(length((texCoord - vec2(0.5)) * 2.0), 1.2) * 0.5); col = pow(col, vec4(0.45454545454545)); gl_FragColor = vec4(col.rgb, 1.0); gl_FragColor.a = 1.0; }`;

    // --- ENGINE VARS ---
    let gl;
    let renderSpec = { width: 0, height: 0, aspect: 1, array: new Float32Array(3), halfWidth: 0, halfHeight: 0, halfArray: new Float32Array(3) };
    renderSpec.setSize = (w, h) => {
      renderSpec.width = w; renderSpec.height = h; renderSpec.aspect = w / h;
      renderSpec.array[0] = w; renderSpec.array[1] = h; renderSpec.array[2] = renderSpec.aspect;
      renderSpec.halfWidth = Math.floor(w / 2); renderSpec.halfHeight = Math.floor(h / 2);
      renderSpec.halfArray[0] = renderSpec.halfWidth; renderSpec.halfArray[1] = renderSpec.halfHeight; renderSpec.halfArray[2] = renderSpec.halfWidth / renderSpec.halfHeight;
    };

    let projection = { angle: 60, nearfar: new Float32Array([0.1, 100.0]), matrix: Matrix44.createIdentity() };
    let camera = { position: Vector3.create(0, 0, 100), lookat: Vector3.create(0, 0, 0), up: Vector3.create(0, 1, 0), dof: Vector3.create(10.0, 4.0, 8.0), matrix: Matrix44.createIdentity() };
    let pointFlower = {};
    let effectLib = {};
    let timeInfo = { start: new Date(), prev: new Date(), delta: 0, elapsed: 0 };
    let animationId;

    // --- HELPERS ---
    const createProgram = (vtx, frg, unifs, attrs) => {
      let v = gl.createShader(gl.VERTEX_SHADER); gl.shaderSource(v, vtx); gl.compileShader(v);
      let f = gl.createShader(gl.FRAGMENT_SHADER); gl.shaderSource(f, frg); gl.compileShader(f);
      if (!gl.getShaderParameter(v, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(v));
      if (!gl.getShaderParameter(f, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(f));
      let p = gl.createProgram(); gl.attachShader(p, v); gl.attachShader(p, f); gl.linkProgram(p);
      let ret = { program: p, uniforms: {}, attributes: {} };
      if (unifs) unifs.forEach(u => ret.uniforms[u] = gl.getUniformLocation(p, u));
      if (attrs) attrs.forEach(a => ret.attributes[a] = gl.getAttribLocation(p, a));
      return ret;
    };
    const createRt = (w, h) => {
      let rt = { width: w, height: h, frameBuffer: gl.createFramebuffer(), renderBuffer: gl.createRenderbuffer(), texture: gl.createTexture(), dtxArray: new Float32Array([1.0 / w, 1.0 / h]) };
      gl.bindTexture(gl.TEXTURE_2D, rt.texture); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.bindFramebuffer(gl.FRAMEBUFFER, rt.frameBuffer); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, rt.texture, 0);
      gl.bindRenderbuffer(gl.RENDERBUFFER, rt.renderBuffer); gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, w, h);
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, rt.renderBuffer);
      gl.bindTexture(gl.TEXTURE_2D, null); gl.bindRenderbuffer(gl.RENDERBUFFER, null); gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      return rt;
    };

    // --- INIT ---
    try {
      gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    } catch (e) { console.error(e); return; }
    
    const createFrag = (v, f, u, a) => {
        let fx = createProgram(v, f, ['uResolution', 'uSrc', 'uDelta', ...(u || [])], ['aPosition', ...(a || [])]);
        let buf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
        return { program: fx.program, uniforms: fx.uniforms, attributes: fx.attributes, buffer: buf };
    };
    effectLib.sceneBg = createFrag(fx_common_vsh, bg_fsh, ['uTimes']);
    effectLib.mkBrightBuf = createFrag(fx_common_vsh, fx_brightbuf_fsh);
    effectLib.dirBlur = createFrag(fx_common_vsh, fx_dirblur_r4_fsh, ['uBlurDir']);
    effectLib.finalComp = createFrag(pp_final_vsh, pp_final_fsh, ['uBloom']);

    pointFlower.program = createProgram(sakura_point_vsh, sakura_point_fsh, ['uProjection', 'uModelview', 'uResolution', 'uOffset', 'uDOF', 'uFade'], ['aPosition', 'aEuler', 'aMisc']);
    pointFlower.numFlowers = 1200; 
    pointFlower.particles = [];
    pointFlower.dataArray = new Float32Array(pointFlower.numFlowers * 8);
    pointFlower.buffer = gl.createBuffer();
    pointFlower.fader = Vector3.create(0.0, 10.0, 0.0);
    pointFlower.offset = new Float32Array([0,0,0]);
    pointFlower.area = Vector3.create(20.0, 20.0, 20.0);

    for(let i=0; i<pointFlower.numFlowers; i++) {
        let p = { pos: [0,0,0], vel: [0,0,0], rot: [0,0,0], euler: [0,0,0], size: 1.0, alpha: 1.0, zkey: 0 };
        let rand = () => Math.random() * 2.0 - 1.0;
        p.vel = [rand() * 0.3 + 0.8, rand() * 0.2 - 1.0, rand() * 0.3 + 0.5];
        let vlen = Math.sqrt(p.vel[0]**2 + p.vel[1]**2 + p.vel[2]**2);
        p.vel = p.vel.map(v => v/vlen * (2.0 + Math.random()));
        p.rot = [rand()*Math.PI, rand()*Math.PI, rand()*Math.PI];
        p.pos = [rand()*20, rand()*20, rand()*20];
        p.euler = [Math.random()*Math.PI*2, Math.random()*Math.PI*2, Math.random()*Math.PI*2];
        p.size = 0.6 + Math.random() * 0.6;
        pointFlower.particles.push(p);
    }

    // --- ANIMATION LOOP ---
    const animateLoop = () => {
        let now = new Date();
        timeInfo.elapsed = (now - timeInfo.start) / 1000.0;
        timeInfo.delta = (now - timeInfo.prev) / 1000.0;
        timeInfo.prev = now;

        renderSpec.setSize(gl.canvas.width, gl.canvas.height);
        gl.viewport(0, 0, renderSpec.width, renderSpec.height);
        pointFlower.area.x = pointFlower.area.y * renderSpec.aspect;
        pointFlower.fader.x = 10.0; pointFlower.fader.y = pointFlower.area.z; pointFlower.fader.z = 0.1;
        
        camera.position.z = pointFlower.area.z + 0.1; 
        projection.angle = Math.atan2(pointFlower.area.y, camera.position.z + pointFlower.area.z) * 180.0 / Math.PI * 2.0;
        Matrix44.loadProjection(projection.matrix, renderSpec.aspect, projection.angle, 0.1, 100.0);
        Matrix44.loadLookAt(camera.matrix, camera.position, camera.lookat, camera.up);

        ['mainRT', 'wFullRT0', 'wFullRT1'].forEach(k => { if(!renderSpec[k]) renderSpec[k] = createRt(renderSpec.width, renderSpec.height); });
        ['wHalfRT0', 'wHalfRT1'].forEach(k => { if(!renderSpec[k]) renderSpec[k] = createRt(renderSpec.halfWidth, renderSpec.halfHeight); });

        gl.bindFramebuffer(gl.FRAMEBUFFER, renderSpec.mainRT.frameBuffer);
        gl.viewport(0, 0, renderSpec.mainRT.width, renderSpec.mainRT.height);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // Draw BG (FIXED: Access .uniforms on wrapper object, not program)
        gl.disable(gl.DEPTH_TEST);
        let bgFx = effectLib.sceneBg;
        gl.useProgram(bgFx.program);
        gl.uniform3fv(bgFx.uniforms.uResolution, renderSpec.array);
        gl.uniform2f(bgFx.uniforms.uTimes, timeInfo.elapsed, timeInfo.delta);
        gl.bindBuffer(gl.ARRAY_BUFFER, bgFx.buffer);
        gl.vertexAttribPointer(bgFx.attributes.aPosition, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(bgFx.attributes.aPosition);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        // Draw Flowers
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        let prog = pointFlower.program.program;
        gl.useProgram(prog);
        gl.uniformMatrix4fv(pointFlower.program.uniforms.uProjection, false, projection.matrix);
        gl.uniformMatrix4fv(pointFlower.program.uniforms.uModelview, false, camera.matrix);
        gl.uniform3fv(pointFlower.program.uniforms.uResolution, renderSpec.array);
        gl.uniform3fv(pointFlower.program.uniforms.uDOF, Vector3.arrayForm(camera.dof));
        gl.uniform3fv(pointFlower.program.uniforms.uFade, Vector3.arrayForm(pointFlower.fader));
        
        let off = 0; let pdata = pointFlower.dataArray;
        pointFlower.particles.forEach(p => {
            p.pos[0] += p.vel[0] * timeInfo.delta; p.pos[1] += p.vel[1] * timeInfo.delta; p.pos[2] += p.vel[2] * timeInfo.delta;
            p.euler[0] += p.rot[0] * timeInfo.delta; p.euler[1] += p.rot[1] * timeInfo.delta; p.euler[2] += p.rot[2] * timeInfo.delta;
            [0,1,2].forEach(k => {
                let lim = k===0? pointFlower.area.x : pointFlower.area.y; if(k===2) lim=pointFlower.area.z;
                if(Math.abs(p.pos[k]) - p.size*0.5 > lim) { if(p.pos[k]>0) p.pos[k] -= lim*2; else p.pos[k] += lim*2; }
            });
            pdata[off++] = p.pos[0]; pdata[off++] = p.pos[1]; pdata[off++] = p.pos[2];
            pdata[off++] = p.euler[0]; pdata[off++] = p.euler[1]; pdata[off++] = p.euler[2];
            pdata[off++] = p.size; pdata[off++] = p.alpha;
        });

        gl.bindBuffer(gl.ARRAY_BUFFER, pointFlower.buffer);
        gl.bufferData(gl.ARRAY_BUFFER, pdata, gl.DYNAMIC_DRAW);
        gl.vertexAttribPointer(pointFlower.program.attributes.aPosition, 3, gl.FLOAT, false, 32, 0);
        gl.enableVertexAttribArray(pointFlower.program.attributes.aPosition);
        gl.vertexAttribPointer(pointFlower.program.attributes.aEuler, 3, gl.FLOAT, false, 32, 12);
        gl.enableVertexAttribArray(pointFlower.program.attributes.aEuler);
        gl.vertexAttribPointer(pointFlower.program.attributes.aMisc, 2, gl.FLOAT, false, 32, 24);
        gl.enableVertexAttribArray(pointFlower.program.attributes.aMisc);
        gl.uniform3fv(pointFlower.program.uniforms.uOffset, new Float32Array([0,0,0]));
        gl.drawArrays(gl.POINT, 0, pointFlower.numFlowers);

        // --- POST PROCESS ---
        gl.disable(gl.DEPTH_TEST);
        
        const drawFrag = (fx, src, delta) => {
            gl.useProgram(fx.program);
            gl.uniform3fv(fx.uniforms.uResolution, renderSpec.array);
            if(src) {
                gl.uniform2fv(fx.uniforms.uDelta, delta || src.dtxArray);
                gl.uniform1i(fx.uniforms.uSrc, 0);
                gl.activeTexture(gl.TEXTURE0);
                gl.bindTexture(gl.TEXTURE_2D, src.texture);
            }
            gl.bindBuffer(gl.ARRAY_BUFFER, fx.buffer);
            gl.vertexAttribPointer(fx.attributes.aPosition, 2, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(fx.attributes.aPosition);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        };
        
        gl.bindFramebuffer(gl.FRAMEBUFFER, renderSpec.wHalfRT0.frameBuffer);
        gl.viewport(0, 0, renderSpec.halfWidth, renderSpec.halfHeight);
        drawFrag(effectLib.mkBrightBuf, renderSpec.mainRT);
        
        for(let i=0; i<2; i++) {
            let p = 1.5 + i; let s = 2.0 + i;
            gl.bindFramebuffer(gl.FRAMEBUFFER, renderSpec.wHalfRT1.frameBuffer);
            drawFrag(effectLib.dirBlur, renderSpec.wHalfRT0);
            gl.uniform4f(effectLib.dirBlur.uniforms.uBlurDir, p, 0, s, 0);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

            gl.bindFramebuffer(gl.FRAMEBUFFER, renderSpec.wHalfRT0.frameBuffer);
            drawFrag(effectLib.dirBlur, renderSpec.wHalfRT1);
            gl.uniform4f(effectLib.dirBlur.uniforms.uBlurDir, 0, p, 0, s);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        }

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, renderSpec.width, renderSpec.height);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        
        gl.useProgram(effectLib.finalComp.program);
        gl.uniform3fv(effectLib.finalComp.uniforms.uResolution, renderSpec.array);
        gl.uniform1i(effectLib.finalComp.uniforms.uSrc, 0);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, renderSpec.mainRT.texture);
        
        gl.uniform1i(effectLib.finalComp.uniforms.uBloom, 1);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, renderSpec.wHalfRT0.texture);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, effectLib.finalComp.buffer);
        gl.vertexAttribPointer(effectLib.finalComp.attributes.aPosition, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(effectLib.finalComp.attributes.aPosition);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        animationId = requestAnimationFrame(animateLoop);
    };

    const onResize = () => {
        let b = document.body; let d = document.documentElement;
        let w = Math.max(b.clientWidth, b.scrollWidth, d.scrollWidth, d.clientWidth);
        let h = Math.max(b.clientHeight, b.scrollHeight, d.scrollHeight, d.clientHeight);
        canvas.width = w; canvas.height = canvas.parentElement ? canvas.parentElement.clientHeight : h;
    };
    window.addEventListener('resize', onResize);
    onResize();

    animateLoop();

    return () => {
        window.removeEventListener('resize', onResize);
        cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <section
      style={{
        position: "relative",
        minHeight: "100vh",
        background: "#16100d",
        overflow: "hidden",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 1, 
          pointerEvents: "none",
          width: "100%",
          height: "100%"
        }}
      />
      <div
        style={{
          position: "relative",
          zIndex: 10,
          paddingTop: "10vh",
          textAlign: "center",
        }}
      >
        <h2
          className="gold-gradient-text"
          style={{ fontSize: "3rem", marginBottom: "3rem" }}
        >
          Academic Excellence
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "2rem",
            width: "min(90%, 800px)",
            marginInline: "auto",
          }}
        >
          {images.map((src, i) => (
            <div
              key={i}
              style={{
                aspectRatio: "4/3",
                overflow: "hidden",
                borderRadius: "6px",
                boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
                background: "#000",
              }}
            >
              <img
                src={src}
                alt={`Graduation ${i + 1}`}
                draggable={false}
                style={{
                  display: "block",
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default GraduationSection;