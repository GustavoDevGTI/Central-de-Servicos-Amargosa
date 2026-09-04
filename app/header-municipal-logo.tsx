/* eslint-disable @next/next/no-img-element -- a sobreposição preserva a arte oficial sem redesenhá-la */

const LOGO_SRC = "/logo-prefeitura-amargosa-texto-branco.png";

export default function HeaderMunicipalLogo() {
  return (
    <span
      className="header-municipal-logo"
      role="img"
      aria-label="Prefeitura de Amargosa — Cidade Jardim de Todos"
    >
      <img
        className="header-municipal-logo-base"
        src={LOGO_SRC}
        alt=""
        aria-hidden="true"
      />
      <img
        className="header-municipal-logo-text"
        src={LOGO_SRC}
        alt=""
        aria-hidden="true"
      />
    </span>
  );
}
