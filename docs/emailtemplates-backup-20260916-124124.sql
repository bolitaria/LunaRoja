--
-- PostgreSQL database dump
--

\restrict 8bpsMwkcLAZBCXGJbgfbOtLMibo2DN1xbPW9JQEBvNRbPfTBHA6CpQ90sfnJJ8h

-- Dumped from database version 14.24
-- Dumped by pg_dump version 14.24

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: EmailTemplates; Type: TABLE DATA; Schema: public; Owner: lunaroja
--

INSERT INTO public."EmailTemplates" (id, name, subject, body, variables, type, "associatedEvent", "isActive", "createdAt", "updatedAt", "headerColor", "buttonColor", "footerColor", "backgroundColor", "titleColor", "footerTitleColor") VALUES (1, 'Bienvenida', '¡Bienvenido a Voces Palestinas por la Justicia!', '<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bienvenid@ a Voces Palestinas</title>
  <style>
    body { font-family: ''Inter'', Arial, sans-serif; margin:0; background:#f3f4f6; }
    .container { max-width:640px; width:100%; margin:0 auto; background:#ffffff; border-radius:12px; overflow:hidden; }
    .header { background:#b91c1c; padding:32px 24px; text-align:center; }
    .header img { width:220px; max-width:80%; height:auto; }
    .content { padding:36px 28px; color:#1f2937; line-height:1.7; font-size:18px; text-align:center; }
    .title { color:#b91c1c; font-size:28px; font-weight:700; margin:0 0 12px; }
    .subtitle { color:#4b5563; font-size:20px; margin:0 0 24px; }
    .btn {
      display:inline-block; background:#16a34a; color:#ffffff; font-weight:600;
      text-decoration:none; padding:12px 0; border-radius:10px; font-size:17px;
      text-align:center; width:100%; box-sizing:border-box;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }
    .footer { background:#1f2937; padding:28px 24px; text-align:center; font-size:14px; color:#d1d5db; }
    .footer a { color:#fca5a5; text-decoration:none; }
    .divider { border-top:1px solid #e5e7eb; margin:28px 0; }
    .unsubscribe-note { font-size:13px; color:#9ca3af; margin-top:24px; }
    .unsubscribe-note a { color:#9ca3af; text-decoration:underline; }

    .feature-table { margin:24px 0; width:100%; }
    .feature-table td { padding:0 12px 20px 12px; vertical-align:top; }
    .feature-icon { width:40px; text-align:center; }
    .feature-icon svg { width:24px; height:24px; fill:#16a34a; }
    .feature-text { text-align:left; font-size:16px; }

    .btn-grid { width:100%; }
    .btn-grid td { width:50%; padding:8px; }

    .gallery-link { display:inline-block; color:#b91c1c; text-decoration:none; font-weight:600; font-size:16px; margin-top:16px; }
    .gallery-link svg { width:20px; height:20px; fill:#b91c1c; vertical-align:middle; margin-right:4px; }

    .instagram-link { display:inline-block; color:#b91c1c; text-decoration:none; font-weight:600; font-size:16px; margin-top:8px; }
    .instagram-link svg { width:20px; height:20px; fill:#b91c1c; vertical-align:middle; margin-right:4px; }

    @media (max-width:480px) {
      .content { padding:24px 18px; }
      .btn { padding:12px 0; font-size:16px; }
      .btn-grid td { display:block; width:100% !important; padding:8px 0; }
      .feature-table td { display:block; width:100% !important; padding:8px 0; }
      .feature-icon { float:left; margin-right:10px; }
    }
  </style>
</head>
<body style="background:#f3f4f6; padding:30px 0;">
  <table role="presentation" class="container">
    <tr>
      <td class="header">
        <h1 style="color:#ffffff; font-size:24px; margin:0;">Voces Palestinas por la Justicia</h1>
      </td>
    </tr>
    <tr>
      <td class="content">
        <h1 class="title">¡Bienvenid@, {{username}}!</h1>
        <p class="subtitle">Gracias por unirte a <strong>Voces Palestinas por la Justicia</strong>.</p>
        <p>Las ideas que nacen de la verdad no mueren. Te mantendremos al tanto de nuestras campañas, acciones y noticias.</p>

        <h2 style="color:#1f2937; font-size:22px; font-weight:600; margin:32px 0 16px;">Lo que recibirás</h2>
        <table class="feature-table" cellpadding="0" cellspacing="0">
          <tr>
            <td class="feature-icon">
              <svg viewBox="0 0 24 24"><path d="M12 8H4a2 2 0 00-2 2v4a2 2 0 002 2h1v4a1 1 0 001.6.8L12 16h5a2 2 0 002-2v-4a2 2 0 00-2-2h-5zM4 10h8v4H4v-4zm10 5.5V8.5l4 1.5v2l-4 1.5z"/></svg>
            </td>
            <td class="feature-text"><strong>Campañas y acciones</strong> Protestas, marchas, boicots, talleres, webinars…</td>
          </tr>
          <tr>
            <td class="feature-icon">
              <svg viewBox="0 0 24 24"><path d="M4 22h16a2 2 0 002-2V4a2 2 0 00-2-2H4a2 2 0 00-2 2v16a2 2 0 002 2zm0-2V4h16v16H4zm2-4h12v2H6v-2zm0-4h12v2H6v-2zm0-4h12v2H6V8z"/></svg>
            </td>
            <td class="feature-text"><strong>Noticias y análisis</strong> Artículos sobre Palestina, BDS, derechos humanos y actualidad.</td>
          </tr>
          <tr>
            <td class="feature-icon">
              <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </td>
            <td class="feature-text"><strong>Recordatorios (si los activas)</strong> Un día antes de cada acción, recibirás un aviso.</td>
          </tr>
        </table>

        <div class="divider"></div>

        <h2 style="color:#1f2937; font-size:22px; font-weight:600; margin:0 0 16px;">Explora nuestra web</h2>
        <table role="presentation" class="btn-grid" cellpadding="0" cellspacing="0">
          <tr>
            <td><a href="{{frontendUrl}}/acciones" class="btn">Acciones</a></td>
            <td><a href="{{frontendUrl}}/campanas" class="btn">Campañas</a></td>
          </tr>
          <tr>
            <td><a href="{{frontendUrl}}/noticias" class="btn">Noticias</a></td>
            <td><a href="{{frontendUrl}}/reports" class="btn">Reportes</a></td>
          </tr>
        </table>

        <a href="{{frontendUrl}}/galeria" class="gallery-link">
          <svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
          Galería
        </a>

        <br/>
        <a href="https://www.instagram.com/stories/voces_palestinas_malaga" class="instagram-link">
          <svg fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
          </svg>
          @voces_palestinas_malaga
        </a>

        <p class="unsubscribe-note">
          Si no deseas recibir estos correos, puedes {{{safeLink unsubscribeLink "darte de baja"}}}.
        </p>
      </td>
    </tr>
    <tr>
      <td class="footer">
        <p style="margin:0 0 12px;">© {{currentYear}} Voces Palestinas por la Justicia</p>
        <a href="https://www.instagram.com/stories/voces_palestinas_malaga" style="text-decoration:none;">
          <svg fill="currentColor" viewBox="0 0 24 24" width="24" height="24" style="color:#d1d5db; vertical-align:middle;">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
          </svg>
        </a>
      </td>
    </tr>
  </table>
</body>
</html>', '[]', 'system', 'subscriber_welcome', true, '2026-09-07 17:40:01.889+00', '2026-09-07 17:40:01.889+00', '#b91c1c', '#16a34a', '#1f2937', '#f3f4f6', '#ffffff', '#ffffff');
INSERT INTO public."EmailTemplates" (id, name, subject, body, variables, type, "associatedEvent", "isActive", "createdAt", "updatedAt", "headerColor", "buttonColor", "footerColor", "backgroundColor", "titleColor", "footerTitleColor") VALUES (2, 'Notificación de campaña', 'Nueva campaña', '<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{campaign.name}}</title>
  <style>
    body {
      font-family: ''Inter'', Arial, sans-serif;
      margin: 0;
      background-color: #f3f4f6;
      color: #1f2937;
    }
    .container {
      max-width: 640px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0,0,0,0.08);
    }
    .header {
      background-color: #E30613;
      background-image: url("data:image/svg+xml,%3Csvg width=''60'' height=''60'' viewBox=''0 0 60 60'' xmlns=''http://www.w3.org/2000/svg''%3E%3Cg fill=''none'' stroke=''%23ffffff'' stroke-opacity=''0.15'' stroke-width=''1''%3E%3Cpath d=''M0 0l60 60M60 0L0 60''/%3E%3C/g%3E%3C/svg%3E");
      padding: 40px 24px;
      text-align: center;
    }
    .header h1 {
      color: #ffffff;
      font-size: 26px;
      font-weight: 700;
      margin: 0;
      text-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }
    .content {
      padding: 40px 30px;
    }
    .title {
      color: #E30613;
      font-size: 28px;
      font-weight: 700;
      margin: 0 0 16px;
    }
    .description {
      font-size: 18px;
      line-height: 1.7;
      color: #4b5563;
    }
    .btn-primary {
      display: inline-block;
      background-color: #008000;
      color: #ffffff;
      font-weight: 600;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 10px;
      font-size: 17px;
      margin: 24px 0;
      box-shadow: 0 4px 8px rgba(0,128,0,0.3);
    }
    .btn-unfollow {
      display: inline-block;
      color: #E30613;
      text-decoration: underline;
      font-size: 14px;
      margin-top: 16px;
    }
    .unsubscribe-note {
      font-size: 13px;
      color: #9ca3af;
      margin-top: 32px;
    }
    .unsubscribe-note a {
      color: #9ca3af;
      text-decoration: underline;
    }
    .footer {
      background-color: #1f2937;
      padding: 24px;
      text-align: center;
      color: #d1d5db;
      font-size: 14px;
    }
    .footer .tricolor {
      width: 100%;
      height: 4px;
      margin-bottom: 16px;
    }
    .tricolor span {
      display: inline-block;
      height: 100%;
      width: 33.33%;
    }
    .tricolor .red { background: #E30613; }
    .tricolor .green { background: #008000; }
    .tricolor .black { background: #111; }
    .footer a {
      color: #fca5a5;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <table role="presentation" cellpadding="0" cellspacing="0" class="container">
    <tr>
      <td class="header">
        <h1>Voces Palestinas por la Justicia</h1>
      </td>
    </tr>
    <tr>
      <td class="content">
        <h1 class="title">{{campaign.name}}</h1>
        <p class="description">{{campaign.description}}</p>
        <p style="margin:32px 0;">
          {{{safeLink campaign.url "Conocer más"}}}
        </p>
        {{#if unfollowLink}}
        <p>
          <a href="{{unfollowLink}}" class="btn-unfollow">Dejar de seguir esta campaña</a>
        </p>
        {{/if}}
        <p class="unsubscribe-note">
          {{{safeLink unsubscribeLink "Darse de baja de todos los correos"}}}
        </p>
      </td>
    </tr>
    <tr>
      <td class="footer">
        <div class="tricolor">
          <span class="red"></span><span class="green"></span><span class="black"></span>
        </div>
        <p>© {{currentYear}} Voces Palestinas por la Justicia</p>
        <a href="https://www.instagram.com/stories/voces_palestinas_malaga">Instagram</a>
      </td>
    </tr>
  </table>
</body>
</html>', '[]', 'system', 'campaign_created', true, '2026-09-07 17:40:01.964+00', '2026-09-07 17:40:01.964+00', '#b91c1c', '#16a34a', '#1f2937', '#f3f4f6', '#ffffff', '#ffffff');
INSERT INTO public."EmailTemplates" (id, name, subject, body, variables, type, "associatedEvent", "isActive", "createdAt", "updatedAt", "headerColor", "buttonColor", "footerColor", "backgroundColor", "titleColor", "footerTitleColor") VALUES (3, 'Notificación de acción', 'Nueva acción', '<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{action.title}}</title>
  <style>
    /* estilos comunes (idénticos a campaign) */
    body { font-family: ''Inter'', Arial, sans-serif; margin:0; background:#f3f4f6; color:#1f2937; }
    .container { max-width:640px; margin:0 auto; background:#fff; border-radius:16px; overflow:hidden; box-shadow:0 4px 20px rgba(0,0,0,0.08); }
    .header { background:#E30613; background-image:url("data:image/svg+xml,%3Csvg width=''60'' height=''60'' viewBox=''0 0 60 60'' xmlns=''http://www.w3.org/2000/svg''%3E%3Cg fill=''none'' stroke=''%23ffffff'' stroke-opacity=''0.15'' stroke-width=''1''%3E%3Cpath d=''M0 0l60 60M60 0L0 60''/%3E%3C/g%3E%3C/svg%3E"); padding:40px 24px; text-align:center; }
    .header h1 { color:#fff; font-size:26px; font-weight:700; margin:0; }
    .content { padding:40px 30px; }
    .title { color:#E30613; font-size:28px; font-weight:700; margin:0 0 16px; }
    .info { text-align:left; font-size:16px; line-height:1.6; color:#4b5563; }
    .info strong { color:#1f2937; }
    .btn-primary { display:inline-block; background:#008000; color:#fff; font-weight:600; text-decoration:none; padding:14px 32px; border-radius:10px; font-size:17px; margin:24px 0; box-shadow:0 4px 8px rgba(0,128,0,0.3); }
    .btn-unfollow { color:#E30613; text-decoration:underline; font-size:14px; margin-top:16px; }
    .unsubscribe-note { font-size:13px; color:#9ca3af; margin-top:32px; }
    .unsubscribe-note a { color:#9ca3af; text-decoration:underline; }
    .footer { background:#1f2937; padding:24px; text-align:center; color:#d1d5db; font-size:14px; }
    .tricolor { width:100%; height:4px; margin-bottom:16px; }
    .tricolor span { display:inline-block; height:100%; width:33.33%; }
    .tricolor .red { background:#E30613; } .tricolor .green { background:#008000; } .tricolor .black { background:#111; }
    .footer a { color:#fca5a5; text-decoration:none; }
  </style>
</head>
<body>
  <table role="presentation" cellpadding="0" cellspacing="0" class="container">
    <tr><td class="header"><h1>Voces Palestinas por la Justicia</h1></td></tr>
    <tr>
      <td class="content">
        <h1 class="title">{{action.title}}</h1>
        <div class="info">
          {{#if campaign}}<p><strong>Campaña:</strong> {{campaign.name}}</p>{{/if}}
          <p><strong>📅 Fecha y hora:</strong> {{formatDate action.datetime}}</p>
          <p><strong>Tipo:</strong> {{action.category}}</p>
          <p><strong>Lugar:</strong> {{#if action.locationType}}{{action.locationType}}{{else}}Presencial{{/if}}{{#if action.placeName}} - {{action.placeName}}{{/if}}</p>
          {{#if action.description}}<p>{{action.description}}</p>{{/if}}
        </div>
        {{#if action.registrationLink}}
        <p>{{{safeLink action.registrationLink "Inscribirme"}}}</p>
        {{/if}}
        {{#if unfollowLink}}
        <p><a href="{{unfollowLink}}" class="btn-unfollow">Dejar de seguir esta acción</a></p>
        {{/if}}
        <p class="unsubscribe-note">{{{safeLink unsubscribeLink "Darse de baja de todos los correos"}}}</p>
      </td>
    </tr>
    <tr>
      <td class="footer">
        <div class="tricolor"><span class="red"></span><span class="green"></span><span class="black"></span></div>
        <p>© {{currentYear}} Voces Palestinas por la Justicia</p>
        <a href="https://www.instagram.com/stories/voces_palestinas_malaga">Instagram</a>
      </td>
    </tr>
  </table>
</body>
</html>', '[]', 'system', 'action_created', true, '2026-09-07 17:40:01.976+00', '2026-09-07 17:40:01.976+00', '#b91c1c', '#16a34a', '#1f2937', '#f3f4f6', '#ffffff', '#ffffff');
INSERT INTO public."EmailTemplates" (id, name, subject, body, variables, type, "associatedEvent", "isActive", "createdAt", "updatedAt", "headerColor", "buttonColor", "footerColor", "backgroundColor", "titleColor", "footerTitleColor") VALUES (4, 'Recordatorio de acción', 'Recordatorio de acción', '<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Recordatorio: {{action.title}}</title>
  <style>
    body { font-family: ''Inter'', Arial, sans-serif; margin:0; background:#f3f4f6; }
    .container { max-width:640px; width:100%; margin:0 auto; background:#fff; border-radius:12px; overflow:hidden; }
    .header { background:#b91c1c; padding:32px 24px; text-align:center; }
    .header img { width:220px; max-width:80%; height:auto; }
    .content { padding:36px 28px; color:#1f2937; line-height:1.7; font-size:18px; text-align:center; }
    .title { color:#b91c1c; font-size:28px; font-weight:700; margin:0 0 16px; }
    .btn { display:inline-block; background:#16a34a; color:#ffffff; font-weight:600;
           text-decoration:none; padding:12px 24px; border-radius:10px; font-size:17px; }
    .footer { background:#1f2937; padding:28px 24px; text-align:center; font-size:14px; color:#d1d5db; }
    .footer a { color:#fca5a5; }
    .unsubscribe-note { font-size:13px; color:#9ca3af; margin-top:24px; }
    .unsubscribe-note a { color:#9ca3af; text-decoration:underline; }
  </style>
</head>
<body style="background:#f3f4f6; padding:30px 0;">
  <table role="presentation" class="container">
    <tr>
      <td class="header">
        <h1 style="color:#ffffff; font-size:24px; margin:0;">Voces Palestinas por la Justicia</h1>
      </td>
    </tr>
    <tr>
      <td class="content">
        <h1 class="title">Recordatorio: {{action.title}}</h1>
        <p>La acción se celebrará <strong>mañana</strong>.</p>
        <p><strong>📅 Fecha:</strong> {{formatDate action.datetime}}</p>
        {{#if action.registrationLink}}
        <p style="margin:32px 0;">
          {{{safeLink action.registrationLink "Inscribirme"}}}
        </p>
        {{/if}}
        <p>¡Esperamos verte!</p>
        <p class="unsubscribe-note">
          {{{safeLink unsubscribeLink "Darse de baja"}}}
        </p>
      </td>
    </tr>
    <tr>
      <td class="footer">
        <p style="margin:0 0 16px;">© {{currentYear}} Voces Palestinas por la Justicia</p>
        <a href="https://www.instagram.com/stories/voces_palestinas_malaga" style="text-decoration:none;">
          <svg fill="currentColor" viewBox="0 0 24 24" width="24" height="24" style="color:#d1d5db; vertical-align:middle;">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
          </svg>
        </a>
      </td>
    </tr>
  </table>
</body>
</html>', '[]', 'system', 'reminder', true, '2026-09-07 17:40:01.988+00', '2026-09-07 17:40:01.988+00', '#b91c1c', '#16a34a', '#1f2937', '#f3f4f6', '#ffffff', '#ffffff');
INSERT INTO public."EmailTemplates" (id, name, subject, body, variables, type, "associatedEvent", "isActive", "createdAt", "updatedAt", "headerColor", "buttonColor", "footerColor", "backgroundColor", "titleColor", "footerTitleColor") VALUES (6, 'Despedida', 'Lamentamos que te vayas', '<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Hasta pronto</title>
  <style>
    body { font-family: ''Inter'', Arial, sans-serif; margin:0; background:#f3f4f6; }
    .container { max-width:640px; width:100%; margin:0 auto; background:#fff; border-radius:12px; overflow:hidden; }
    .header { background:#b91c1c; padding:32px 24px; text-align:center; }
    .header img { width:220px; max-width:80%; height:auto; }
    .content { padding:36px 28px; color:#1f2937; line-height:1.7; font-size:18px; text-align:center; }
    .title { color:#b91c1c; font-size:28px; font-weight:700; margin:0 0 16px; }
    .footer { background:#1f2937; padding:28px 24px; text-align:center; font-size:14px; color:#d1d5db; }
    .footer a { color:#fca5a5; }
  </style>
</head>
<body style="background:#f3f4f6; padding:30px 0;">
  <table role="presentation" class="container">
    <tr>
      <td class="header">
        <!-- LOGO aquí -->
        <h1 style="color:#ffffff; font-size:24px; margin:0;">Voces Palestinas por la Justicia</h1>
      </td>
    </tr>
    <tr>
      <td class="content">
        <h1 class="title">Hasta pronto</h1>
        <p>Hemos procesado tu baja. Siempre serás bienvenid@ si decides volver.</p>
        <p>Gracias por haber estado con nosotros.</p>
      </td>
    </tr>
    <tr>
      <td class="footer">
        <p style="margin:0 0 16px;">© {{currentYear}} Voces Palestinas por la Justicia</p>
        <a href="https://www.instagram.com/stories/voces_palestinas_malaga" style="text-decoration:none;">
          <svg fill="currentColor" viewBox="0 0 24 24" width="24" height="24" style="color:#d1d5db; vertical-align:middle;">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
          </svg>
        </a>
      </td>
    </tr>
  </table>
</body>
</html>', '[]', 'system', 'subscriber_goodbye', true, '2026-09-08 11:47:27.843+00', '2026-09-08 11:47:27.843+00', '#b91c1c', '#16a34a', '#1f2937', '#f3f4f6', '#ffffff', '#ffffff');
INSERT INTO public."EmailTemplates" (id, name, subject, body, variables, type, "associatedEvent", "isActive", "createdAt", "updatedAt", "headerColor", "buttonColor", "footerColor", "backgroundColor", "titleColor", "footerTitleColor") VALUES (7, 'Restablecer contraseña', 'Restablecer tu contraseña', '<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Restablecer contraseña</title>
  <style>
    body { font-family: ''Inter'', Arial, sans-serif; margin:0; background:#f3f4f6; }
    .container { max-width:640px; width:100%; margin:0 auto; background:#fff; border-radius:12px; overflow:hidden; }
    .header { background:#b91c1c; padding:32px 24px; text-align:center; }
    .header img { width:220px; max-width:80%; height:auto; }
    .content { padding:36px 28px; color:#1f2937; line-height:1.7; font-size:18px; text-align:center; }
    .title { color:#b91c1c; font-size:28px; font-weight:700; margin:0 0 16px; }
    .btn { display:inline-block; background:#16a34a; color:#ffffff; font-weight:600;
           text-decoration:none; padding:12px 24px; border-radius:10px; font-size:17px; }
    .footer { background:#1f2937; padding:28px 24px; text-align:center; font-size:14px; color:#d1d5db; }
    .footer a { color:#fca5a5; }
  </style>
</head>
<body style="background:#f3f4f6; padding:30px 0;">
  <table role="presentation" class="container">
    <tr>
      <td class="header">
        <h1 style="color:#ffffff; font-size:24px; margin:0;">Voces Palestinas por la Justicia</h1>
      </td>
    </tr>
    <tr>
      <td class="content">
        <h1 class="title">Restablecer tu contraseña</h1>
        <p>Hola {{username}},</p>
        <p>Haz clic para crear una nueva contraseña:</p>
        <p style="margin:32px 0;">
          {{{safeLink resetUrl "Nueva contraseña"}}}
        </p>
        <p style="font-size:14px; color:#6b7280;">Este enlace caduca en 1 hora.</p>
      </td>
    </tr>
    <tr>
      <td class="footer">
        <p style="margin:0 0 16px;">© {{currentYear}} Voces Palestinas por la Justicia</p>
        <a href="https://www.instagram.com/stories/voces_palestinas_malaga" style="text-decoration:none;">
          <svg fill="currentColor" viewBox="0 0 24 24" width="24" height="24" style="color:#d1d5db; vertical-align:middle;">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
          </svg>
        </a>
      </td>
    </tr>
  </table>
</body>
</html>', '[]', 'system', 'password_reset', true, '2026-09-08 11:47:27.87+00', '2026-09-08 11:47:27.87+00', '#b91c1c', '#16a34a', '#1f2937', '#f3f4f6', '#ffffff', '#ffffff');
INSERT INTO public."EmailTemplates" (id, name, subject, body, variables, type, "associatedEvent", "isActive", "createdAt", "updatedAt", "headerColor", "buttonColor", "footerColor", "backgroundColor", "titleColor", "footerTitleColor") VALUES (8, 'Donaciones disponibles', '¡Ya puedes donar!', '<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>🍉 Donaciones disponibles</title>
  <style>
    body { font-family: ''Inter'', Arial, sans-serif; margin:0; background:#f3f4f6; }
    .container { max-width:640px; width:100%; margin:0 auto; background:#fff; border-radius:12px; overflow:hidden; }
    .header { background:#b91c1c; padding:32px 24px; text-align:center; }
    .header img { width:220px; max-width:80%; height:auto; }
    .content { padding:36px 28px; color:#1f2937; line-height:1.7; font-size:18px; text-align:center; }
    .title { color:#b91c1c; font-size:28px; font-weight:700; margin:0 0 16px; }
    .btn { display:inline-block; background:#16a34a; color:#ffffff; font-weight:600;
           text-decoration:none; padding:14px 32px; border-radius:10px; font-size:18px; }
    .footer { background:#1f2937; padding:28px 24px; text-align:center; font-size:14px; color:#d1d5db; }
    .footer a { color:#fca5a5; }
    .unsubscribe-note { font-size:13px; color:#9ca3af; margin-top:24px; }
    .unsubscribe-note a { color:#9ca3af; text-decoration:underline; }
  </style>
</head>
<body style="background:#f3f4f6; padding:30px 0;">
  <table role="presentation" class="container">
    <tr>
      <td class="header">
        <h1 style="color:#ffffff; font-size:24px; margin:0;">Voces Palestinas por la Justicia</h1>
      </td>
    </tr>
    <tr>
      <td class="content">
        <h1 class="title">🍉 ¡Ya puedes donar!</h1>
        <p>Las donaciones ya están activas. Cada aportación ayuda a mantener nuestra lucha.</p>
        <p style="margin:32px 0;">
          {{{safeLink donationUrl "Donar ahora ❤️"}}}
        </p>
        <p class="unsubscribe-note">
          {{{safeLink unsubscribeLink "Darse de baja"}}}
        </p>
      </td>
    </tr>
    <tr>
      <td class="footer">
        <p style="margin:0 0 16px;">© {{currentYear}} Voces Palestinas por la Justicia</p>
        <a href="https://www.instagram.com/stories/voces_palestinas_malaga" style="text-decoration:none;">
          <svg fill="currentColor" viewBox="0 0 24 24" width="24" height="24" style="color:#d1d5db; vertical-align:middle;">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
          </svg>
        </a>
      </td>
    </tr>
  </table>
</body>
</html>', '[]', 'system', 'donation_available', true, '2026-09-08 11:47:27.876+00', '2026-09-08 11:47:27.876+00', '#b91c1c', '#16a34a', '#1f2937', '#f3f4f6', '#ffffff', '#ffffff');
INSERT INTO public."EmailTemplates" (id, name, subject, body, variables, type, "associatedEvent", "isActive", "createdAt", "updatedAt", "headerColor", "buttonColor", "footerColor", "backgroundColor", "titleColor", "footerTitleColor") VALUES (9, 'Notificación de reporte', 'Nuevo reporte', '<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{report.title}}</title>
  <style>
    /* estilos comunes */
    body { font-family: ''Inter'', Arial, sans-serif; margin:0; background:#f3f4f6; color:#1f2937; }
    .container { max-width:640px; margin:0 auto; background:#fff; border-radius:16px; overflow:hidden; box-shadow:0 4px 20px rgba(0,0,0,0.08); }
    .header { background:#E30613; background-image:url("data:image/svg+xml,%3Csvg width=''60'' height=''60'' viewBox=''0 0 60 60'' xmlns=''http://www.w3.org/2000/svg''%3E%3Cg fill=''none'' stroke=''%23ffffff'' stroke-opacity=''0.15'' stroke-width=''1''%3E%3Cpath d=''M0 0l60 60M60 0L0 60''/%3E%3C/g%3E%3C/svg%3E"); padding:40px 24px; text-align:center; }
    .header h1 { color:#fff; font-size:26px; font-weight:700; margin:0; }
    .content { padding:40px 30px; text-align:center; }
    .title { color:#E30613; font-size:28px; font-weight:700; margin:0 0 16px; }
    .description { font-size:18px; line-height:1.7; color:#4b5563; }
    .btn-primary { display:inline-block; background:#008000; color:#fff; font-weight:600; text-decoration:none; padding:14px 32px; border-radius:10px; font-size:17px; margin:24px 0; box-shadow:0 4px 8px rgba(0,128,0,0.3); }
    .unsubscribe-note { font-size:13px; color:#9ca3af; margin-top:32px; }
    .unsubscribe-note a { color:#9ca3af; text-decoration:underline; }
    .footer { background:#1f2937; padding:24px; text-align:center; color:#d1d5db; font-size:14px; }
    .tricolor { width:100%; height:4px; margin-bottom:16px; }
    .tricolor span { display:inline-block; height:100%; width:33.33%; }
    .tricolor .red { background:#E30613; } .tricolor .green { background:#008000; } .tricolor .black { background:#111; }
    .footer a { color:#fca5a5; text-decoration:none; }
  </style>
</head>
<body>
  <table role="presentation" cellpadding="0" cellspacing="0" class="container">
    <tr><td class="header"><h1>Voces Palestinas por la Justicia</h1></td></tr>
    <tr>
      <td class="content">
        <h1 class="title">{{report.title}}</h1>
        <p class="description">{{report.description}}</p>
        <p>{{{safeLink reportUrl "Leer más"}}}</p>
        <p class="unsubscribe-note">{{{safeLink unsubscribeLink "Darse de baja de todos los correos"}}}</p>
      </td>
    </tr>
    <tr>
      <td class="footer">
        <div class="tricolor"><span class="red"></span><span class="green"></span><span class="black"></span></div>
        <p>© {{currentYear}} Voces Palestinas por la Justicia</p>
        <a href="https://www.instagram.com/stories/voces_palestinas_malaga">Instagram</a>
      </td>
    </tr>
  </table>
</body>
</html>', '[]', 'system', 'report_created', true, '2026-09-08 11:47:27.885+00', '2026-09-08 11:47:27.885+00', '#b91c1c', '#16a34a', '#1f2937', '#f3f4f6', '#ffffff', '#ffffff');
INSERT INTO public."EmailTemplates" (id, name, subject, body, variables, type, "associatedEvent", "isActive", "createdAt", "updatedAt", "headerColor", "buttonColor", "footerColor", "backgroundColor", "titleColor", "footerTitleColor") VALUES (5, 'Notificación de petición', 'Nueva petición', '<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{petition.title}}</title>
  <style>
    body { font-family: ''Inter'', Arial, sans-serif; margin:0; background:#f3f4f6; color:#1f2937; }
    .container { max-width:640px; margin:0 auto; background:#fff; border-radius:16px; overflow:hidden; box-shadow:0 4px 20px rgba(0,0,0,0.08); }
    .header { background:#E30613; background-image:url("data:image/svg+xml,%3Csvg width=''60'' height=''60'' viewBox=''0 0 60 60'' xmlns=''http://www.w3.org/2000/svg''%3E%3Cg fill=''none'' stroke=''%23ffffff'' stroke-opacity=''0.15'' stroke-width=''1''%3E%3Cpath d=''M0 0l60 60M60 0L0 60''/%3E%3C/g%3E%3C/svg%3E"); padding:40px 24px; text-align:center; }
    .header h1 { color:#fff; font-size:26px; font-weight:700; margin:0; }
    .content { padding:40px 30px; text-align:left; }
    .title { color:#E30613; font-size:28px; font-weight:700; margin:0 0 16px; }
    .description { font-size:17px; line-height:1.7; color:#374151; }
    .description p { margin:0 0 14px 0; }
    .description a { color:#E30613; text-decoration:underline; }
    .unsubscribe-note { font-size:13px; color:#9ca3af; margin-top:32px; text-align:center; }
    .unsubscribe-note a { color:#9ca3af; text-decoration:underline; }
    .footer { background:#1f2937; padding:24px; text-align:center; color:#d1d5db; font-size:14px; }
    .tricolor { width:100%; height:4px; margin-bottom:16px; }
    .tricolor span { display:inline-block; height:100%; width:33.33%; }
    .tricolor .red { background:#E30613; } .tricolor .green { background:#008000; } .tricolor .black { background:#111; }
    .footer a { color:#fca5a5; text-decoration:none; }
  </style>
</head>
<body>
  <table role="presentation" cellpadding="0" cellspacing="0" class="container">
    <tr><td class="header"><h1>Voces Palestinas por la Justicia</h1></td></tr>
    <tr>
      <td class="content">
        <h1 class="title">{{petition.title}}</h1>
        <div class="description">{{{content}}}</div>
        
      </td>
    </tr>
    <tr>
      <td class="footer">
        <div class="tricolor"><span class="red"></span><span class="green"></span><span class="black"></span></div>
        <p>© {{currentYear}} Voces Palestinas por la Justicia</p>
        <a href="https://www.instagram.com/stories/voces_palestinas_malaga">Instagram</a>
      </td>
    </tr>
  </table>
</body>
</html>', '[]', 'system', 'petition', true, '2026-09-07 17:40:02.011+00', '2026-09-07 17:40:02.011+00', '#b91c1c', '#16a34a', '#1f2937', '#f3f4f6', '#ffffff', '#ffffff');


--
-- Name: EmailTemplates_id_seq; Type: SEQUENCE SET; Schema: public; Owner: lunaroja
--

SELECT pg_catalog.setval('public."EmailTemplates_id_seq"', 9, true);


--
-- PostgreSQL database dump complete
--

\unrestrict 8bpsMwkcLAZBCXGJbgfbOtLMibo2DN1xbPW9JQEBvNRbPfTBHA6CpQ90sfnJJ8h

