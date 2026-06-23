export const mocked_google_consent_screen_html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Mocked Google Consent Screen</title>
    <style>
      :root {
        color-scheme: light dark;
        --page: #f6f7f9;
        --panel: #ffffff;
        --panel-muted: #f8fafc;
        --text: #1f2937;
        --muted: #5f6774;
        --border: #c8d0dc;
        --border-strong: #7b8798;
        --input: #ffffff;
        --accent: #0b57d0;
        --accent-hover: #0a46a8;
        --accent-text: #ffffff;
        --danger: #b3261e;
        --focus: rgb(11 87 208 / 28%);
        --shadow: 0 18px 48px rgb(31 41 55 / 12%);
      }

      @media (prefers-color-scheme: dark) {
        :root {
          --page: #111318;
          --panel: #1b1f27;
          --panel-muted: #222733;
          --text: #eef2f8;
          --muted: #b7c0cf;
          --border: #566171;
          --border-strong: #9aa6b7;
          --input: #12161d;
          --accent: #8ab4f8;
          --accent-hover: #a8c7fa;
          --accent-text: #101318;
          --danger: #f2b8b5;
          --focus: rgb(138 180 248 / 34%);
          --shadow: 0 22px 56px rgb(0 0 0 / 42%);
        }
      }

      * {
        box-sizing: border-box;
      }

      html {
        min-height: 100%;
      }

      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        padding: clamp(16px, 4vw, 40px);
        background:
          linear-gradient(180deg, var(--panel-muted), transparent 240px),
          var(--page);
        color: var(--text);
        font-family:
          "Google Sans", Roboto, Inter, ui-sans-serif, system-ui, -apple-system,
          BlinkMacSystemFont, "Segoe UI", sans-serif;
      }

      main {
        width: min(100%, 760px);
        padding: clamp(24px, 5vw, 44px);
        background: var(--panel);
        border: 1px solid var(--border);
        border-radius: 8px;
        box-shadow: var(--shadow);
      }

      header {
        display: grid;
        gap: 10px;
        margin-bottom: 24px;
      }

      h1 {
        margin: 0;
        color: var(--text);
        font-size: clamp(24px, 4vw, 32px);
        line-height: 1.15;
        font-weight: 500;
      }

      p {
        max-width: 62ch;
        margin: 0;
        color: var(--muted);
        font-size: 15px;
        line-height: 1.55;
      }

      code {
        padding: 2px 5px;
        border: 1px solid var(--border);
        border-radius: 4px;
        background: var(--panel-muted);
        color: var(--text);
        font-family:
          "Roboto Mono", "SFMono-Regular", Consolas, ui-monospace, monospace;
        font-size: 0.92em;
      }

      form {
        display: grid;
        gap: 18px;
      }

      .field {
        display: grid;
        gap: 8px;
        color: var(--text);
        font-size: 13px;
        font-weight: 600;
      }

      .field-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
      }

      .field-head label {
        font: inherit;
      }

      .ghost.reset {
        min-height: 26px;
        padding: 0 10px;
        font-weight: 600;
        text-transform: lowercase;
      }

      .field input {
        width: 100%;
        min-height: 40px;
        padding: 10px 12px;
        border: 1px solid var(--border-strong);
        border-radius: 6px;
        background: var(--input);
        color: var(--text);
        font: inherit;
        font-weight: 400;
        font-size: 13px;
      }

      .field input:focus,
      textarea:focus,
      .node input:focus,
      .node select:focus {
        border-color: var(--accent);
        outline: 3px solid var(--focus);
        outline-offset: 1px;
      }

      .tabs {
        display: flex;
        gap: 4px;
        border-bottom: 1px solid var(--border);
      }

      .tab {
        appearance: none;
        min-height: 38px;
        padding: 0 16px;
        border: 1px solid transparent;
        border-bottom: none;
        border-radius: 6px 6px 0 0;
        background: transparent;
        color: var(--muted);
        font: inherit;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        margin-bottom: -1px;
      }

      .tab.active {
        color: var(--text);
        background: var(--panel-muted);
        border-color: var(--border);
        border-bottom-color: var(--panel-muted);
      }

      .tabpanel[hidden] {
        display: none;
      }

      textarea {
        width: 100%;
        min-height: 260px;
        max-height: 54vh;
        padding: 14px 16px;
        border: 1px solid var(--border-strong);
        border-radius: 6px;
        background: var(--input);
        color: var(--text);
        font-family:
          "Roboto Mono", "SFMono-Regular", Consolas, ui-monospace, monospace;
        font-size: 13px;
        line-height: 1.55;
        resize: vertical;
        tab-size: 2;
      }

      .builder {
        border: 1px solid var(--border);
        border-radius: 6px;
        background: var(--panel-muted);
        padding: 12px;
      }

      .node {
        display: grid;
        gap: 8px;
        margin: 4px 0;
      }

      .node-head {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 8px;
      }

      .key-input {
        min-height: 32px;
        padding: 6px 9px;
        border: 1px solid var(--border-strong);
        border-radius: 5px;
        background: var(--input);
        color: var(--text);
        font: inherit;
        font-size: 12px;
        font-weight: 600;
        min-width: 130px;
      }

      .idx {
        min-width: 28px;
        font-size: 12px;
        font-weight: 700;
        color: var(--muted);
      }

      .type-select {
        min-height: 32px;
        padding: 4px 8px;
        border: 1px solid var(--border);
        border-radius: 5px;
        background: var(--input);
        color: var(--muted);
        font: inherit;
        font-size: 12px;
      }

      .node input.val {
        flex: 1 1 200px;
        min-height: 34px;
        padding: 7px 10px;
        border: 1px solid var(--border-strong);
        border-radius: 5px;
        background: var(--input);
        color: var(--text);
        font: inherit;
        font-size: 13px;
      }

      .node input[type="checkbox"].val {
        flex: 0 0 auto;
        width: 18px;
        height: 18px;
      }

      .nullval {
        color: var(--muted);
        font-style: italic;
        font-size: 13px;
      }

      details.branch {
        border-left: 2px solid var(--border);
        margin-left: 6px;
        padding-left: 12px;
      }

      details.branch > summary {
        cursor: pointer;
        font-size: 12px;
        font-weight: 700;
        color: var(--muted);
        list-style: revert;
        user-select: none;
      }

      .ghost {
        appearance: none;
        min-height: 30px;
        padding: 0 12px;
        border: 1px dashed var(--border-strong);
        border-radius: 5px;
        background: transparent;
        color: var(--muted);
        font: inherit;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
      }

      .ghost:hover {
        color: var(--text);
        border-color: var(--accent);
      }

      .ghost.remove {
        border-style: solid;
        color: var(--danger);
        border-color: var(--danger);
      }

      .ghost.add {
        margin-top: 4px;
      }

      .error {
        margin: 0;
        min-height: 18px;
        color: var(--danger);
        font-size: 12px;
        font-weight: 600;
      }

      .actions {
        display: flex;
        justify-content: flex-end;
      }

      button.submit {
        min-height: 42px;
        padding: 0 22px;
        border: 1px solid transparent;
        border-radius: 6px;
        background: var(--accent);
        color: var(--accent-text);
        font: inherit;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
      }

      button.submit:hover {
        background: var(--accent-hover);
      }

      button:focus-visible {
        outline: 3px solid var(--focus);
        outline-offset: 2px;
      }

      @media (max-width: 520px) {
        body {
          align-items: start;
        }

        main {
          box-shadow: none;
        }

        button.submit {
          width: 100%;
        }
      }
    </style>
  </head>
  <body>
    <main>
      <header>
        <h1>Mocked Google Consent Screen</h1>
        <p>
          Use the <strong>Form</strong> tab to click together the callback
          <code>code</code>, or switch to <strong>JSON</strong> to paste raw
          payload. Both tabs stay in sync. <code>State</code> and the redirect
          URI are editable below.
        </p>
      </header>
      <form id="consent-form" method="GET" action="__REDIRECT_URI__">
        <div class="field">
          <div class="field-head">
            <span>Code payload</span>
            <button type="button" class="ghost reset" data-reset="code">
              reset
            </button>
          </div>
          <div class="tabs" role="tablist">
            <button type="button" class="tab active" data-tab="form">
              Form
            </button>
            <button type="button" class="tab" data-tab="json">JSON</button>
          </div>

          <div class="tabpanel" data-panel="form">
            <div id="form-root" class="builder"></div>
            <p id="form-error" class="error"></p>
          </div>

          <div class="tabpanel" data-panel="json" hidden>
            <textarea name="code" id="code-json" spellcheck="false">__DEFAULT_CODE__</textarea>
            <p id="json-error" class="error"></p>
          </div>
        </div>

        <div class="field">
          <div class="field-head">
            <label for="state-input">State</label>
            <button type="button" class="ghost reset" data-reset="state">
              reset
            </button>
          </div>
          <input
            id="state-input"
            type="text"
            name="state"
            value="__STATE__"
            autocomplete="off"
            spellcheck="false"
          />
        </div>
        <div class="field">
          <div class="field-head">
            <label for="redirect-uri">Redirect URI</label>
            <button type="button" class="ghost reset" data-reset="redirect">
              reset
            </button>
          </div>
          <input
            id="redirect-uri"
            type="text"
            value="__REDIRECT_URI__"
            autocomplete="off"
            spellcheck="false"
          />
        </div>

        <div class="actions">
          <button type="submit" class="submit">Continue</button>
        </div>
      </form>
    </main>

    <script>
      (function () {
        function randomState() {
          return (
            (crypto && crypto.randomUUID && crypto.randomUUID()) ||
            String(Date.now())
          );
        }

        var stateInput = document.getElementById("state-input");
        if (!stateInput.value) {
          stateInput.value = randomState();
        }

        var jsonArea = document.getElementById("code-json");
        var formRoot = document.getElementById("form-root");
        var jsonError = document.getElementById("json-error");
        var formError = document.getElementById("form-error");
        var form = document.getElementById("consent-form");
        var redirectInput = document.getElementById("redirect-uri");

        // Snapshot the server-rendered defaults so each block can reset to them.
        var defaults = {
          code: jsonArea.value,
          state: stateInput.value,
          redirect: redirectInput.value,
        };
        var TYPES = ["string", "number", "boolean", "null", "object", "array"];
        var rootNode = { type: "object", entries: [] };

        function fromJson(v) {
          if (v === null) return { type: "null" };
          if (Array.isArray(v)) {
            return { type: "array", items: v.map(fromJson) };
          }
          if (typeof v === "object") {
            return {
              type: "object",
              entries: Object.keys(v).map(function (k) {
                return { key: k, node: fromJson(v[k]) };
              }),
            };
          }
          if (typeof v === "number") return { type: "number", value: v };
          if (typeof v === "boolean") return { type: "boolean", value: v };
          return { type: "string", value: String(v) };
        }

        function toJson(node) {
          if (node.type === "object") {
            var o = {};
            node.entries.forEach(function (e) {
              o[e.key] = toJson(e.node);
            });
            return o;
          }
          if (node.type === "array") return node.items.map(toJson);
          if (node.type === "number") {
            var n = Number(node.value);
            return isNaN(n) ? 0 : n;
          }
          if (node.type === "boolean") return !!node.value;
          if (node.type === "null") return null;
          return String(node.value == null ? "" : node.value);
        }

        function makeNode(type) {
          if (type === "object") return { type: "object", entries: [] };
          if (type === "array") return { type: "array", items: [] };
          if (type === "number") return { type: "number", value: 0 };
          if (type === "boolean") return { type: "boolean", value: false };
          if (type === "null") return { type: "null" };
          return { type: "string", value: "" };
        }

        function replaceNode(node, next) {
          var k;
          for (k in node) {
            if (Object.prototype.hasOwnProperty.call(node, k)) delete node[k];
          }
          for (k in next) {
            if (Object.prototype.hasOwnProperty.call(next, k)) {
              node[k] = next[k];
            }
          }
        }

        function syncJson() {
          jsonArea.value = JSON.stringify(toJson(rootNode), null, 2);
        }

        function el(tag, cls) {
          var e = document.createElement(tag);
          if (cls) e.className = cls;
          return e;
        }

        function renderNode(node, onRemove, keyControl) {
          var wrap = el("div", "node node-" + node.type);
          var head = el("div", "node-head");
          if (keyControl) head.appendChild(keyControl);

          var typeSel = el("select", "type-select");
          TYPES.forEach(function (t) {
            var o = document.createElement("option");
            o.value = t;
            o.textContent = t;
            if (t === node.type) o.selected = true;
            typeSel.appendChild(o);
          });
          typeSel.addEventListener("change", function () {
            replaceNode(node, makeNode(typeSel.value));
            render();
          });
          head.appendChild(typeSel);

          if (onRemove) {
            var rm = el("button", "ghost remove");
            rm.type = "button";
            rm.textContent = "remove";
            rm.addEventListener("click", function () {
              onRemove();
              render();
            });
            head.appendChild(rm);
          }

          if (node.type === "boolean") {
            var cb = el("input", "val");
            cb.type = "checkbox";
            cb.checked = !!node.value;
            cb.addEventListener("change", function () {
              node.value = cb.checked;
              syncJson();
            });
            head.appendChild(cb);
          } else if (node.type === "null") {
            var nu = el("span", "nullval");
            nu.textContent = "null";
            head.appendChild(nu);
          } else if (node.type === "string" || node.type === "number") {
            var inp = el("input", "val");
            inp.type = node.type === "number" ? "number" : "text";
            inp.value = node.value;
            inp.addEventListener("input", function () {
              node.value = inp.value;
              syncJson();
            });
            head.appendChild(inp);
          }
          wrap.appendChild(head);

          if (node.type === "object") {
            var det = el("details", "branch");
            det.open = true;
            var sum = document.createElement("summary");
            sum.textContent = "object (" + node.entries.length + ")";
            det.appendChild(sum);
            node.entries.forEach(function (entry, idx) {
              var keyInput = el("input", "key-input");
              keyInput.value = entry.key;
              keyInput.placeholder = "key";
              keyInput.addEventListener("input", function () {
                entry.key = keyInput.value;
                syncJson();
              });
              det.appendChild(
                renderNode(
                  entry.node,
                  function () {
                    node.entries.splice(idx, 1);
                  },
                  keyInput,
                ),
              );
            });
            var add = el("button", "ghost add");
            add.type = "button";
            add.textContent = "+ property";
            add.addEventListener("click", function () {
              node.entries.push({
                key: "key" + (node.entries.length + 1),
                node: makeNode("string"),
              });
              render();
            });
            det.appendChild(add);
            wrap.appendChild(det);
          } else if (node.type === "array") {
            var detA = el("details", "branch");
            detA.open = true;
            var sumA = document.createElement("summary");
            sumA.textContent = "array [" + node.items.length + "]";
            detA.appendChild(sumA);
            node.items.forEach(function (item, idx) {
              var label = el("span", "idx");
              label.textContent = String(idx);
              detA.appendChild(
                renderNode(
                  item,
                  function () {
                    node.items.splice(idx, 1);
                  },
                  label,
                ),
              );
            });
            var addA = el("button", "ghost add");
            addA.type = "button";
            addA.textContent = "+ item";
            addA.addEventListener("click", function () {
              node.items.push(makeNode("string"));
              render();
            });
            detA.appendChild(addA);
            wrap.appendChild(detA);
          }

          return wrap;
        }

        function render() {
          formRoot.innerHTML = "";
          formRoot.appendChild(renderNode(rootNode, null, null));
          formError.textContent = "";
          syncJson();
        }

        function loadFromJson() {
          try {
            var parsed = JSON.parse(jsonArea.value || "null");
            rootNode = fromJson(parsed);
            jsonError.textContent = "";
            return true;
          } catch (e) {
            jsonError.textContent = "Invalid JSON: " + e.message;
            return false;
          }
        }

        var tabs = document.querySelectorAll("[data-tab]");
        var panels = document.querySelectorAll("[data-panel]");
        function activate(name) {
          tabs.forEach(function (t) {
            t.classList.toggle("active", t.getAttribute("data-tab") === name);
          });
          panels.forEach(function (p) {
            p.hidden = p.getAttribute("data-panel") !== name;
          });
          if (name === "form") {
            if (loadFromJson()) {
              render();
            } else {
              formError.textContent =
                "Fix the JSON before using the form tab.";
            }
          }
        }
        tabs.forEach(function (t) {
          t.addEventListener("click", function () {
            activate(t.getAttribute("data-tab"));
          });
        });

        jsonArea.addEventListener("input", function () {
          try {
            JSON.parse(jsonArea.value || "null");
            jsonError.textContent = "";
          } catch (e) {
            jsonError.textContent = "Invalid JSON: " + e.message;
          }
        });

        function isFormTabActive() {
          var formTab = document.querySelector('[data-tab="form"]');
          return formTab && formTab.classList.contains("active");
        }

        var resetters = {
          code: function () {
            jsonArea.value = defaults.code;
            jsonError.textContent = "";
            if (isFormTabActive() && loadFromJson()) {
              render();
            }
          },
          state: function () {
            // Default may have been a server uuid; if it was blank, mint a new one.
            stateInput.value = defaults.state || randomState();
          },
          redirect: function () {
            redirectInput.value = defaults.redirect;
          },
        };

        document.querySelectorAll("[data-reset]").forEach(function (btn) {
          btn.addEventListener("click", function () {
            var fn = resetters[btn.getAttribute("data-reset")];
            if (fn) fn();
          });
        });

        form.addEventListener("submit", function () {
          if (redirectInput && redirectInput.value) {
            form.action = redirectInput.value;
          }
        });

        loadFromJson();
        render();
        activate("form");
      })();
    </script>
  </body>
</html>`;
