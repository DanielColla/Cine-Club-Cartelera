#!/usr/bin/env node

/**
 * Script de validación de configuración
 * Uso: node scripts/validate-config.js
 */

require('dotenv').config();

console.log('\n📋 Validando configuración del proyecto...\n');

const checks = {
  'NODE_ENV definida': process.env.NODE_ENV,
  'DATABASE_URL definida': process.env.DATABASE_URL,
  'DATABASE_URL válida': process.env.DATABASE_URL?.includes('postgresql://'),
  'PORT definida': process.env.PORT,
  'CORS_ORIGIN definida': process.env.CORS_ORIGIN
};

let allPass = true;

Object.entries(checks).forEach(([key, value]) => {
  const pass = !!value;
  const icon = pass ? '✅' : '❌';
  console.log(`${icon} ${key}: ${value || 'NO CONFIGURADA'}`);
  if (!pass) allPass = false;
});

console.log('\n' + '='.repeat(60));

if (allPass) {
  console.log('✅ ¡Configuración correcta! Listo para deploy en Render.\n');
} else {
  console.log('❌ Falta configurar variables de entorno.\n');
  console.log('Agrega estas variables en Render → Web Service → Environment:');
  console.log('  - NODE_ENV = production');
  console.log('  - DATABASE_URL = <URL de PostgreSQL>');
  console.log('  - CORS_ORIGIN = tu-dominio.onrender.com');
  console.log('  - PORT = 3000\n');
  process.exit(1);
}
