class ShaderCanvas {
  constructor(fragmentShaderURL, width, height) {
    this.canvas = document.createElement("canvas");
    this.canvas.width = width;
    this.canvas.height = height;
    document.body.appendChild(this.canvas);

    this.gl = this.canvas.getContext("webgl");
    if (!this.gl) {
      console.error("WebGL not supported");
      throw new Error("WebGL not supported");
    }

    // Inline vertex shader source
    this.vertexShaderSource = `
      attribute vec4 position;
      void main() {
          gl_Position = position;
      }
    `;

    this.program = null;
    this.attributeLocations = {};
    this.uniformLocations = {};

    this.initPromise = this.init(fragmentShaderURL);

    // Bind resize event
    window.addEventListener("resize", this.handleResize.bind(this));
  }

  async init(fragmentShaderURL) {
    try {
      const fragmentShaderSource = await this.fetchShader(fragmentShaderURL);

      const vertexShader = this.compileShader(
        this.vertexShaderSource,
        this.gl.VERTEX_SHADER
      );
      const fragmentShader = this.compileShader(
        fragmentShaderSource,
        this.gl.FRAGMENT_SHADER
      );

      this.program = this.createProgram(vertexShader, fragmentShader);
      this.gl.useProgram(this.program);

      this.initGeometry();
      this.updateResolution();
      this.draw();
    } catch (err) {
      console.error("Initialization error:", err);
      throw err;
    }
  }

  async fetchShader(url) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `Failed to load shader file. Status: ${response.status} ${response.statusText}`
      );
    }
    return response.text();
  }

  compileShader(source, type) {
    const { gl } = this;
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (!success) {
      const log = gl.getShaderInfoLog(shader);
      console.error("Shader compilation failed:");
      console.error(log);
      this.printShaderSourceWithErrors(source, log);
      gl.deleteShader(shader);
      throw new Error("Shader compilation failed");
    }
    return shader;
  }

  printShaderSourceWithErrors(source, log) {
    const lines = source.split("\n");
    console.groupCollapsed("Shader Source error");
    lines.forEach((line, index) => {
      let errorLineMatch = log.match(/ERROR:\s*\d+:(\d+)/);
      let errorLine = errorLineMatch ? parseInt(errorLineMatch[1], 10) : null;
      const lineNumber = index + 1;
      let linePrefix = lineNumber.toString().padStart(3, " ") + ": ";
      if (errorLine && lineNumber === errorLine) {
        console.error(
          `%c${linePrefix}${line}`,
          "color: red; font-weight: bold;"
        );
      } else {
        console.log(`${linePrefix}${line}`);
      }
    });
    console.groupEnd();
  }

  createProgram(vertexShader, fragmentShader) {
    const { gl } = this;
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const infoLog = gl.getProgramInfoLog(program);
      gl.deleteProgram(program);
      console.error("Program linking failed:", infoLog);
      throw new Error("Program linking failed");
    }

    return program;
  }

  initGeometry() {
    const { gl } = this;
    const vertices = new Float32Array([
      -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0,
    ]);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const positionAttribLocation = gl.getAttribLocation(
      this.program,
      "position"
    );
    this.attributeLocations.position = positionAttribLocation;
    gl.enableVertexAttribArray(positionAttribLocation);
    gl.vertexAttribPointer(positionAttribLocation, 2, gl.FLOAT, false, 0, 0);
  }

  draw() {
    const { gl } = this;
    if (!this.program) {
      console.warn("Attempted to draw before the program was initialized.");
      return;
    }
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  getUniformLocation(name) {
    if (!this.program) {
      console.warn("getUniformLocation called before program is ready.");
      return null;
    }
    if (this.uniformLocations[name]) {
      return this.uniformLocations[name];
    }
    const loc = this.gl.getUniformLocation(this.program, name);
    if (loc === null) {
      console.warn(`Uniform '${name}' not found in shader.`);
    }
    this.uniformLocations[name] = loc;
    return loc;
  }

  // Uniform setters
  setUniform1f(name, x) {
    const loc = this.getUniformLocation(name);
    if (loc) this.gl.uniform1f(loc, x);
  }

  setUniform2f(name, x, y) {
    const loc = this.getUniformLocation(name);
    if (loc) this.gl.uniform2f(loc, x, y);
  }

  setUniform3f(name, x, y, z) {
    const loc = this.getUniformLocation(name);
    if (loc) this.gl.uniform3f(loc, x, y, z);
  }

  setUniform4f(name, x, y, z, w) {
    const loc = this.getUniformLocation(name);
    if (loc) this.gl.uniform4f(loc, x, y, z, w);
  }

  setUniform1i(name, i) {
    const loc = this.getUniformLocation(name);
    if (loc) this.gl.uniform1i(loc, i);
  }

  // TODO: Additional uniform setters for matrices, arrays, etc...

  handleResize() {
    // Update canvas size
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;

    // Update the WebGL viewport
    this.gl.viewport(0, 0, window.innerWidth, window.innerHeight);

    // Update the shader uniform for resolution
    this.setUniform2f("iResolution", window.innerWidth, window.innerHeight);

    // Redraw the scene
    this.draw();
  }

  updateResolution() {
    this.setUniform2f("iResolution", this.canvas.width, this.canvas.height);
  }

  getCanvas() {
    return this.canvas;
  }

  getGL() {
    return this.gl;
  }
}

export default ShaderCanvas;
