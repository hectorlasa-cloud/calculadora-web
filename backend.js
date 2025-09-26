window.onload = () => {

  function mostrarSeccion() {
      let ruta = location.hash.slice(1) || "home";
      document.querySelectorAll("main section").forEach(sec => sec.classList.remove("active"));
      const activa = document.getElementById(ruta);
      if (activa) activa.classList.add("active");
      document.querySelectorAll("nav a").forEach(link => {
          link.classList.toggle("active", link.getAttribute("href") === "#" + ruta);
      });
  }
  mostrarSeccion();
  window.addEventListener("hashchange", mostrarSeccion);

  const valor = document.getElementById('operacion');
  const boton = document.getElementById("clear");
  const parrafo = document.getElementById('solucion');

  boton.addEventListener("click", () => {
      parrafo.innerHTML = "";
      parrafo.style.color = "black";
      parrafo.style.background = "white";
      valor.value = "";
  });

  valor.addEventListener("keydown", function(event) {
      if (event.key === "Enter") {
          try {
              const input = valor.value.trim();
              if (/[^0-9+\-*/r().\s]/i.test(input)) {
                  throw "Error: Solo se permiten números y símbolos: +, -, *, /, **, r, ()";
              }

              const tokens = tokenize(input);
              const ast = parse(tokens);
              const resultado = evaluate(ast);

              parrafo.style.color = "black";
              parrafo.style.background = "white";
              parrafo.innerHTML = resultado;
              valor.value = "";

          } catch (error) {
              parrafo.style.color = "red";
              parrafo.style.background = "#222";

              let mensaje = "⚠️ Error desconocido";
              if (/divide/i.test(error) || /Infinity/.test(error)) {
                  mensaje = "Error: No se puede dividir entre 0.";
              } else if (/Expected/.test(error)) {
                  mensaje = "Error: Sintaxis incorrecta. Revisa los paréntesis o los operadores.";
              } else if (/Unknown node/.test(error)) {
                  mensaje = "Error: Símbolo no permitido. Usa solo +, -, *, /, **, r, ()";
              } else if (typeof error === "string") {
                  mensaje = error
              }

              parrafo.innerHTML = mensaje;
          }
      }
  });

  function tokenize(s) {
      const re = /\s*(\*\*|r|\d+\.?\d*|\+|\-|\*|\/|\(|\))/g;
      const tokens = [];
      let m;
      while ((m = re.exec(s)) !== null) {
          const v = m[1];
          if (!isNaN(v)) tokens.push({ t: "NUM", v: +v });
          else if (v === "+") tokens.push({ t: "PLUS" });
          else if (v === "-") tokens.push({ t: "MINUS" });
          else if (v === "*") tokens.push({ t: "MUL" });
          else if (v === "/") tokens.push({ t: "DIV" });
          else if (v === "**") tokens.push({ t: "POW" });
          else if (v === "r") tokens.push({ t: "ROOT" });
          else if (v === "(") tokens.push({ t: "LP" });
          else if (v === ")") tokens.push({ t: "RP" });
      }
      return tokens;
  }

  function parse(tokens) {
      let pos = 0;
      const peek = () => tokens[pos];
      const consume = (t) => {
          if (t && (!peek() || peek().t !== t)) throw `Expected ${t}, got ${peek() ? peek().t : "EOF"}`;
          return tokens[pos++];
      };

      function primary() {
          const cur = peek();
          if (!cur) throw "Error: Expresión incompleta";
          if (cur.t === "NUM") return consume("NUM");
          if (cur.t === "LP") {
              consume("LP");
              const e = expr();
              consume("RP");
              return e;
          }
          throw "Expected number or (";
      }

      function unary() {
          const cur = peek();
          if (cur && cur.t === "ROOT") {
              consume("ROOT");
              return { t: "ROOT", arg: unary() }
          }
          if (cur && cur.t === "PLUS") return { t: "UPLUS", arg: consume("PLUS") };
          if (cur && cur.t === "MINUS") return { t: "UMINUS", arg: consume("MINUS") };
          return primary();
      }

      function power() {
          let left = unary();
          while (peek() && peek().t === "POW") {
              consume("POW");
              left = { t: "POW", left, right: power() };
          }
          return left;
      }

      function term() {
          let left = power();
          while (peek() && (peek().t === "MUL" || peek().t === "DIV")) {
              const op = consume().t;
              left = { t: op === "MUL" ? "MUL" : "DIV", left, right: power() };
          }
          return left;
      }

      function expr() {
          let left = term();
          while (peek() && (peek().t === "PLUS" || peek().t === "MINUS")) {
              const op = consume().t;
              left = { t: op === "PLUS" ? "ADD" : "SUB", left, right: term() };
          }
          return left;
      }

      return expr();
  }
  
  function evaluate(node) {
      switch (node.t) {
          case "NUM": return node.v;
          case "ADD": return evaluate(node.left) + evaluate(node.right);
          case "SUB": return evaluate(node.left) - evaluate(node.right);
          case "MUL": return evaluate(node.left) * evaluate(node.right);
          case "DIV": 
              const divisor = evaluate(node.right);
              if (divisor === 0) throw "Error: No se puede dividir entre 0.";
              return evaluate(node.left) / divisor;
          case "POW": return Math.pow(evaluate(node.left), evaluate(node.right));
          case "ROOT": return Math.sqrt(evaluate(node.arg));
          case "UPLUS": return +evaluate(node.arg);
          case "UMINUS": return -evaluate(node.arg);
          default: throw "Unknown node " + node.t;
      }
  }

};