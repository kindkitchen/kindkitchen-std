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
        width: min(100%, 720px);
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
        gap: 16px;
      }

      label {
        display: grid;
        gap: 8px;
        color: var(--text);
        font-size: 13px;
        font-weight: 600;
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

      textarea:focus {
        border-color: var(--accent);
        outline: 3px solid var(--focus);
        outline-offset: 2px;
      }

      .actions {
        display: flex;
        justify-content: flex-end;
      }

      button {
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

      button:hover {
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

        textarea {
          min-height: 300px;
        }

        button {
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
          Edit the JSON below when needed. Submitting sends it back as the
          callback <code>code</code>.
        </p>
      </header>
      <form method="GET" action="__REDIRECT_URI__">
        <input type="hidden" name="state" value="__STATE__" />
        <label>
          Callback code JSON
          <textarea name="code" spellcheck="false">__DEFAULT_CODE__</textarea>
        </label>
        <div class="actions">
          <button type="submit">Continue</button>
        </div>
      </form>
    </main>
  </body>
</html>`;
