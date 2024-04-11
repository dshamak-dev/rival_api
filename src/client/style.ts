export default `<style>
  #rival-widget {
    position: fixed;
    z-index: 5;
    right: 0;
    top: 0;

    font-size: 14px;
    line-height: 1;

    display: none;

    color: black;
  }
  #rival-widget.visible {
    display: block;
  }

  #rival-popup {
    position: fixed;
    z-index: 6;
    left: 0;
    top: 0;
    width: 100%;
    height: 100vh;

    display: none;
    align-items: center;
    justify-content: center;

    font-size: 18px;
    line-height: 1;

    background: rgba(0,0,0, 0.7);
  }
  #rival-popup.visible {
    display: flex;
  }
  #rival-popup .content {
    position: relative;
    padding: 2rem 3rem;
    background: white;
    color: black;
    border: 3px solid currentColor;

    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  #rival-popup .content #sign-out {
    position: absolute;
    top: 0;
    left: 0;
    padding: 0.5rem;
    font-size: 0.6rem;
    cursor: pointer;
  }
  #rival-popup .content #sign-out:hover {
    color: orangered;
  }

  #rival-popup .content #close {
    --size: 1.5rem;

    position: absolute;
    top: 0;
    right: 0;
    top: calc(var(--size) / -2);
    right: calc(var(--size) / -2);
    width: var(--size);
    height: var(--size);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    background: black;
    color: white;
    border: 1px solid black;
  }
  #rival-popup .content #close:hover {
    color: orangered;
  }

  a {
    text-decoration: underline;
  }

  button,
  .button {
    --bg: 0,0,0;
    --text: 255,255,255;
  
    display: block;
    color:  rgba(var(--text));
    border: 1px solid currentColor;
    padding: 0.5rem 1.5rem;
    background: rgba(var(--bg));
  
    text-transform: capitalize;
    text-decoration: none;
    text-align: center;
  }
  button.secondary,
  .button.secondary {
    --text: 0,0,0;
    --bg: 255,255,255;
  }
  @media (hover: hover) {
    button:not([disabled]):hover,
    .button:not([disabled]):hover {
      box-shadow: 0 4px 4px 0 black;
      transform: translateY(-2px);
      cursor: pointer;
    }
  }
  
  button:not([disabled]):active,
  .button:not([disabled]):active {
    filter: contrast(0.5);
  }

  .number {
    font-family: sans-serif;
  }
  input.number {
    border: 0;
    text-align: center;
    padding: 0;
    width: 100%;
    max-width: 11rem;
    margin: 0 auto;
    outline: 0;
  }

  .text-xs {
    font-size: 0.6rem;
  }
  .text-base {
    font-size: 1rem;
  }
  .text-lg {
    font-size: 1.2rem;
  }
  .text-xl {
    font-size: 1.6rem;
  }
  .text-2xl {
    font-size: 3.2rem;
  }

  .field {
    display: flex;
    flex-direction: column;

    text-align: center;
  }
  .field .label {
    font-size: 0.6rem;
  }

  .error {
    color: orangered;
  }

  .text-center {
    text-align: center;
  }

  .flex {
    display: flex;
  }
  .flex-col {
    flex-direction: column;
  }
  
  .justify-center {
    justify-content: center;
  }
  
  .items-center {
    align-items: center;
  }
  .gap-2 {
    gap: 0.5rem;
  }
  .gap-4 {
    gap: 1rem;
  }
  .gap-8 {
    gap: 2rem;
  }
  .p-4 {
    padding: 1rem;
  }
  .px-4 {
    padding-left: 1rem;
    padding-right: 1rem;
  }
  .py-2 {
    padding-top: 0.5rem;
    padding-bottom: 0.5rem;
  }

  .grow {
    flex-grow: 1;
  }
</style>`;