/**
 * Catálogos oficiales del Ministerio de Hacienda — El Salvador
 * CAT-012: Departamentos
 * CAT-013: Municipios
 *
 * Fuente: Especificación técnica DTE MH El Salvador v1.2
 * Los códigos de municipio son únicos DENTRO de cada departamento.
 * Siempre usar el par (departamentoCod, municipioCod) para identificar un municipio.
 */

export interface Departamento {
  codigo: string;
  nombre: string;
}

export interface Municipio {
  codigo: string;
  nombre: string;
  departamentoCod: string;
}

// ── CAT-012: Departamentos ────────────────────────────────────────────────────

export const DEPARTAMENTOS: Departamento[] = [
  { codigo: '01', nombre: 'Ahuachapán' },
  { codigo: '02', nombre: 'Santa Ana' },
  { codigo: '03', nombre: 'Sonsonate' },
  { codigo: '04', nombre: 'Chalatenango' },
  { codigo: '05', nombre: 'La Libertad' },
  { codigo: '06', nombre: 'San Salvador' },
  { codigo: '07', nombre: 'Cuscatlán' },
  { codigo: '08', nombre: 'La Paz' },
  { codigo: '09', nombre: 'Cabañas' },
  { codigo: '10', nombre: 'San Vicente' },
  { codigo: '11', nombre: 'Usulután' },
  { codigo: '12', nombre: 'San Miguel' },
  { codigo: '13', nombre: 'Morazán' },
  { codigo: '14', nombre: 'La Unión' },
];

// ── CAT-013: Municipios ───────────────────────────────────────────────────────

export const MUNICIPIOS: Municipio[] = [
  // Ahuachapán (01) — 12 municipios
  { codigo: '01', nombre: 'Ahuachapán', departamentoCod: '01' },
  { codigo: '02', nombre: 'Apaneca', departamentoCod: '01' },
  { codigo: '03', nombre: 'Atiquizaya', departamentoCod: '01' },
  { codigo: '04', nombre: 'Concepción de Ataco', departamentoCod: '01' },
  { codigo: '05', nombre: 'El Refugio', departamentoCod: '01' },
  { codigo: '06', nombre: 'Guaymango', departamentoCod: '01' },
  { codigo: '07', nombre: 'Jujutla', departamentoCod: '01' },
  { codigo: '08', nombre: 'San Francisco Menéndez', departamentoCod: '01' },
  { codigo: '09', nombre: 'San Lorenzo', departamentoCod: '01' },
  { codigo: '10', nombre: 'San Pedro Puxtla', departamentoCod: '01' },
  { codigo: '11', nombre: 'Tacuba', departamentoCod: '01' },
  { codigo: '12', nombre: 'Turín', departamentoCod: '01' },

  // Santa Ana (02) — 13 municipios
  { codigo: '01', nombre: 'Santa Ana', departamentoCod: '02' },
  { codigo: '02', nombre: 'Candelaria de la Frontera', departamentoCod: '02' },
  { codigo: '03', nombre: 'Chalchuapa', departamentoCod: '02' },
  { codigo: '04', nombre: 'Coatepeque', departamentoCod: '02' },
  { codigo: '05', nombre: 'El Congo', departamentoCod: '02' },
  { codigo: '06', nombre: 'El Porvenir', departamentoCod: '02' },
  { codigo: '07', nombre: 'Masahuat', departamentoCod: '02' },
  { codigo: '08', nombre: 'Metapán', departamentoCod: '02' },
  { codigo: '09', nombre: 'San Antonio Pajonal', departamentoCod: '02' },
  { codigo: '10', nombre: 'San Sebastián Salitrillo', departamentoCod: '02' },
  { codigo: '11', nombre: 'Santa Rosa Guachipilín', departamentoCod: '02' },
  { codigo: '12', nombre: 'Santiago de la Frontera', departamentoCod: '02' },
  { codigo: '13', nombre: 'Texistepeque', departamentoCod: '02' },

  // Sonsonate (03) — 16 municipios
  { codigo: '01', nombre: 'Sonsonate', departamentoCod: '03' },
  { codigo: '02', nombre: 'Acajutla', departamentoCod: '03' },
  { codigo: '03', nombre: 'Armenia', departamentoCod: '03' },
  { codigo: '04', nombre: 'Caluco', departamentoCod: '03' },
  { codigo: '05', nombre: 'Cuisnahuat', departamentoCod: '03' },
  { codigo: '06', nombre: 'Izalco', departamentoCod: '03' },
  { codigo: '07', nombre: 'Juayúa', departamentoCod: '03' },
  { codigo: '08', nombre: 'Nahuizalco', departamentoCod: '03' },
  { codigo: '09', nombre: 'Nahulingo', departamentoCod: '03' },
  { codigo: '10', nombre: 'Salcoatitán', departamentoCod: '03' },
  { codigo: '11', nombre: 'San Antonio del Monte', departamentoCod: '03' },
  { codigo: '12', nombre: 'San Julián', departamentoCod: '03' },
  { codigo: '13', nombre: 'Santa Catarina Masahuat', departamentoCod: '03' },
  { codigo: '14', nombre: 'Santa Isabel Ishuatán', departamentoCod: '03' },
  { codigo: '15', nombre: 'Santo Domingo de Guzmán', departamentoCod: '03' },
  { codigo: '16', nombre: 'Sonzacate', departamentoCod: '03' },

  // Chalatenango (04) — 33 municipios
  { codigo: '01', nombre: 'Chalatenango', departamentoCod: '04' },
  { codigo: '02', nombre: 'Agua Caliente', departamentoCod: '04' },
  { codigo: '03', nombre: 'Arcatao', departamentoCod: '04' },
  { codigo: '04', nombre: 'Azacualpa', departamentoCod: '04' },
  { codigo: '05', nombre: 'Citalá', departamentoCod: '04' },
  { codigo: '06', nombre: 'Comalapa', departamentoCod: '04' },
  { codigo: '07', nombre: 'Concepción Quezaltepeque', departamentoCod: '04' },
  { codigo: '08', nombre: 'Dulce Nombre de María', departamentoCod: '04' },
  { codigo: '09', nombre: 'El Carrizal', departamentoCod: '04' },
  { codigo: '10', nombre: 'El Paraíso', departamentoCod: '04' },
  { codigo: '11', nombre: 'La Laguna', departamentoCod: '04' },
  { codigo: '12', nombre: 'La Palma', departamentoCod: '04' },
  { codigo: '13', nombre: 'La Reina', departamentoCod: '04' },
  { codigo: '14', nombre: 'Las Vueltas', departamentoCod: '04' },
  { codigo: '15', nombre: 'Nombre de Jesús', departamentoCod: '04' },
  { codigo: '16', nombre: 'Nueva Concepción', departamentoCod: '04' },
  { codigo: '17', nombre: 'Nueva Trinidad', departamentoCod: '04' },
  { codigo: '18', nombre: 'Ojos de Agua', departamentoCod: '04' },
  { codigo: '19', nombre: 'Potonico', departamentoCod: '04' },
  { codigo: '20', nombre: 'San Antonio de la Cruz', departamentoCod: '04' },
  { codigo: '21', nombre: 'San Antonio Los Ranchos', departamentoCod: '04' },
  { codigo: '22', nombre: 'San Fernando', departamentoCod: '04' },
  { codigo: '23', nombre: 'San Francisco Lempa', departamentoCod: '04' },
  { codigo: '24', nombre: 'San Francisco Morazán', departamentoCod: '04' },
  { codigo: '25', nombre: 'San Ignacio', departamentoCod: '04' },
  { codigo: '26', nombre: 'San Isidro Labrador', departamentoCod: '04' },
  { codigo: '27', nombre: 'San José Cancasque', departamentoCod: '04' },
  { codigo: '28', nombre: 'San José Las Flores', departamentoCod: '04' },
  { codigo: '29', nombre: 'San Luis del Carmen', departamentoCod: '04' },
  { codigo: '30', nombre: 'San Miguel de Mercedes', departamentoCod: '04' },
  { codigo: '31', nombre: 'San Rafael', departamentoCod: '04' },
  { codigo: '32', nombre: 'Santa Rita', departamentoCod: '04' },
  { codigo: '33', nombre: 'Tejutla', departamentoCod: '04' },

  // La Libertad (05) — 22 municipios
  { codigo: '01', nombre: 'Santa Tecla', departamentoCod: '05' },
  { codigo: '02', nombre: 'Antiguo Cuscatlán', departamentoCod: '05' },
  { codigo: '03', nombre: 'Chiltiupán', departamentoCod: '05' },
  { codigo: '04', nombre: 'Ciudad Arce', departamentoCod: '05' },
  { codigo: '05', nombre: 'Colón', departamentoCod: '05' },
  { codigo: '06', nombre: 'Comasagua', departamentoCod: '05' },
  { codigo: '07', nombre: 'Huizúcar', departamentoCod: '05' },
  { codigo: '08', nombre: 'Jayaque', departamentoCod: '05' },
  { codigo: '09', nombre: 'Jicalapa', departamentoCod: '05' },
  { codigo: '10', nombre: 'La Libertad', departamentoCod: '05' },
  { codigo: '11', nombre: 'Nuevo Cuscatlán', departamentoCod: '05' },
  { codigo: '12', nombre: 'San Juan Opico', departamentoCod: '05' },
  { codigo: '13', nombre: 'Quezaltepeque', departamentoCod: '05' },
  { codigo: '14', nombre: 'Sacacoyo', departamentoCod: '05' },
  { codigo: '15', nombre: 'San José Villanueva', departamentoCod: '05' },
  { codigo: '16', nombre: 'San Matías', departamentoCod: '05' },
  { codigo: '17', nombre: 'San Pablo Tacachico', departamentoCod: '05' },
  { codigo: '18', nombre: 'Talnique', departamentoCod: '05' },
  { codigo: '19', nombre: 'Tamanique', departamentoCod: '05' },
  { codigo: '20', nombre: 'Teotepeque', departamentoCod: '05' },
  { codigo: '21', nombre: 'Tepecoyo', departamentoCod: '05' },
  { codigo: '22', nombre: 'Zaragoza', departamentoCod: '05' },

  // San Salvador (06) — 19 municipios
  { codigo: '01', nombre: 'San Salvador', departamentoCod: '06' },
  { codigo: '02', nombre: 'Aguilares', departamentoCod: '06' },
  { codigo: '03', nombre: 'Apopa', departamentoCod: '06' },
  { codigo: '04', nombre: 'Ayutuxtepeque', departamentoCod: '06' },
  { codigo: '05', nombre: 'Cuscatancingo', departamentoCod: '06' },
  { codigo: '06', nombre: 'El Paisnal', departamentoCod: '06' },
  { codigo: '07', nombre: 'Guazapa', departamentoCod: '06' },
  { codigo: '08', nombre: 'Ilopango', departamentoCod: '06' },
  { codigo: '09', nombre: 'Mejicanos', departamentoCod: '06' },
  { codigo: '10', nombre: 'Nejapa', departamentoCod: '06' },
  { codigo: '11', nombre: 'Panchimalco', departamentoCod: '06' },
  { codigo: '12', nombre: 'Rosario de Mora', departamentoCod: '06' },
  { codigo: '13', nombre: 'San Marcos', departamentoCod: '06' },
  { codigo: '14', nombre: 'San Martín', departamentoCod: '06' },
  { codigo: '15', nombre: 'Santiago Texacuangos', departamentoCod: '06' },
  { codigo: '16', nombre: 'Santo Tomás', departamentoCod: '06' },
  { codigo: '17', nombre: 'Soyapango', departamentoCod: '06' },
  { codigo: '18', nombre: 'Tonacatepeque', departamentoCod: '06' },
  { codigo: '19', nombre: 'Ciudad Delgado', departamentoCod: '06' },

  // Cuscatlán (07) — 15 municipios
  { codigo: '01', nombre: 'Cojutepeque', departamentoCod: '07' },
  { codigo: '02', nombre: 'El Carmen', departamentoCod: '07' },
  { codigo: '03', nombre: 'El Rosario', departamentoCod: '07' },
  { codigo: '04', nombre: 'Monte San Juan', departamentoCod: '07' },
  { codigo: '05', nombre: 'Oratorio de Concepción', departamentoCod: '07' },
  { codigo: '06', nombre: 'San Bartolomé Perulapía', departamentoCod: '07' },
  { codigo: '07', nombre: 'San Cristóbal', departamentoCod: '07' },
  { codigo: '08', nombre: 'San José Guayabal', departamentoCod: '07' },
  { codigo: '09', nombre: 'San Pedro Perulapán', departamentoCod: '07' },
  { codigo: '10', nombre: 'San Rafael Cedros', departamentoCod: '07' },
  { codigo: '11', nombre: 'San Ramón', departamentoCod: '07' },
  { codigo: '12', nombre: 'Santa Cruz Analquito', departamentoCod: '07' },
  { codigo: '13', nombre: 'Santa Cruz Michapa', departamentoCod: '07' },
  { codigo: '14', nombre: 'Suchitoto', departamentoCod: '07' },
  { codigo: '15', nombre: 'Ciudad El Triunfo', departamentoCod: '07' },

  // La Paz (08) — 22 municipios
  { codigo: '01', nombre: 'Zacatecoluca', departamentoCod: '08' },
  { codigo: '02', nombre: 'Cuyultitán', departamentoCod: '08' },
  { codigo: '03', nombre: 'El Rosario', departamentoCod: '08' },
  { codigo: '04', nombre: 'Jerusalén', departamentoCod: '08' },
  { codigo: '05', nombre: 'Mercedes La Ceiba', departamentoCod: '08' },
  { codigo: '06', nombre: 'Olocuilta', departamentoCod: '08' },
  { codigo: '07', nombre: 'Paraíso de Osorio', departamentoCod: '08' },
  { codigo: '08', nombre: 'San Antonio Masahuat', departamentoCod: '08' },
  { codigo: '09', nombre: 'San emigdio', departamentoCod: '08' },
  { codigo: '10', nombre: 'San Francisco Chinameca', departamentoCod: '08' },
  { codigo: '11', nombre: 'San Juan Nonualco', departamentoCod: '08' },
  { codigo: '12', nombre: 'San Juan Talpa', departamentoCod: '08' },
  { codigo: '13', nombre: 'San Juan Tepezontes', departamentoCod: '08' },
  { codigo: '14', nombre: 'San Luis La Herradura', departamentoCod: '08' },
  { codigo: '15', nombre: 'San Luis Talpa', departamentoCod: '08' },
  { codigo: '16', nombre: 'San Miguel Tepezontes', departamentoCod: '08' },
  { codigo: '17', nombre: 'San Pedro Masahuat', departamentoCod: '08' },
  { codigo: '18', nombre: 'San Pedro Nonualco', departamentoCod: '08' },
  { codigo: '19', nombre: 'San Rafael Obrajuelo', departamentoCod: '08' },
  { codigo: '20', nombre: 'Santa María Ostuma', departamentoCod: '08' },
  { codigo: '21', nombre: 'Santiago Nonualco', departamentoCod: '08' },
  { codigo: '22', nombre: 'Tapalhuaca', departamentoCod: '08' },

  // Cabañas (09) — 9 municipios
  { codigo: '01', nombre: 'Sensuntepeque', departamentoCod: '09' },
  { codigo: '02', nombre: 'Cinquera', departamentoCod: '09' },
  { codigo: '03', nombre: 'Dolores', departamentoCod: '09' },
  { codigo: '04', nombre: 'Guacotecti', departamentoCod: '09' },
  { codigo: '05', nombre: 'Ilobasco', departamentoCod: '09' },
  { codigo: '06', nombre: 'Jutiapa', departamentoCod: '09' },
  { codigo: '07', nombre: 'San Isidro', departamentoCod: '09' },
  { codigo: '08', nombre: 'Tejutepeque', departamentoCod: '09' },
  { codigo: '09', nombre: 'Victoria', departamentoCod: '09' },

  // San Vicente (10) — 13 municipios
  { codigo: '01', nombre: 'San Vicente', departamentoCod: '10' },
  { codigo: '02', nombre: 'Apastepeque', departamentoCod: '10' },
  { codigo: '03', nombre: 'Guadalupe', departamentoCod: '10' },
  { codigo: '04', nombre: 'San Cayetano Istepeque', departamentoCod: '10' },
  { codigo: '05', nombre: 'San Esteban Catarina', departamentoCod: '10' },
  { codigo: '06', nombre: 'San Ildefonso', departamentoCod: '10' },
  { codigo: '07', nombre: 'San Lorenzo', departamentoCod: '10' },
  { codigo: '08', nombre: 'San Sebastián', departamentoCod: '10' },
  { codigo: '09', nombre: 'Santa Clara', departamentoCod: '10' },
  { codigo: '10', nombre: 'Santo Domingo', departamentoCod: '10' },
  { codigo: '11', nombre: 'Tecoluca', departamentoCod: '10' },
  { codigo: '12', nombre: 'Tepetitán', departamentoCod: '10' },
  { codigo: '13', nombre: 'Verapaz', departamentoCod: '10' },

  // Usulután (11) — 23 municipios
  { codigo: '01', nombre: 'Usulután', departamentoCod: '11' },
  { codigo: '02', nombre: 'Alegría', departamentoCod: '11' },
  { codigo: '03', nombre: 'Berlín', departamentoCod: '11' },
  { codigo: '04', nombre: 'California', departamentoCod: '11' },
  { codigo: '05', nombre: 'Concepción Batres', departamentoCod: '11' },
  { codigo: '06', nombre: 'El Triunfo', departamentoCod: '11' },
  { codigo: '07', nombre: 'Ereguayquín', departamentoCod: '11' },
  { codigo: '08', nombre: 'Estanzuelas', departamentoCod: '11' },
  { codigo: '09', nombre: 'Jiquilisco', departamentoCod: '11' },
  { codigo: '10', nombre: 'Jucuapa', departamentoCod: '11' },
  { codigo: '11', nombre: 'Jucuarán', departamentoCod: '11' },
  { codigo: '12', nombre: 'Mercedes Umaña', departamentoCod: '11' },
  { codigo: '13', nombre: 'Nueva Granada', departamentoCod: '11' },
  { codigo: '14', nombre: 'Ozatlán', departamentoCod: '11' },
  { codigo: '15', nombre: 'Puerto El Triunfo', departamentoCod: '11' },
  { codigo: '16', nombre: 'San Agustín', departamentoCod: '11' },
  { codigo: '17', nombre: 'San Buenaventura', departamentoCod: '11' },
  { codigo: '18', nombre: 'San Dionisio', departamentoCod: '11' },
  { codigo: '19', nombre: 'San Francisco Javier', departamentoCod: '11' },
  { codigo: '20', nombre: 'Santa Elena', departamentoCod: '11' },
  { codigo: '21', nombre: 'Santa María', departamentoCod: '11' },
  { codigo: '22', nombre: 'Santiago de María', departamentoCod: '11' },
  { codigo: '23', nombre: 'Tecapán', departamentoCod: '11' },

  // San Miguel (12) — 20 municipios
  { codigo: '01', nombre: 'San Miguel', departamentoCod: '12' },
  { codigo: '02', nombre: 'Carolina', departamentoCod: '12' },
  { codigo: '03', nombre: 'Chapeltique', departamentoCod: '12' },
  { codigo: '04', nombre: 'Chinameca', departamentoCod: '12' },
  { codigo: '05', nombre: 'Chirilagua', departamentoCod: '12' },
  { codigo: '06', nombre: 'Ciudad Barrios', departamentoCod: '12' },
  { codigo: '07', nombre: 'Comacarán', departamentoCod: '12' },
  { codigo: '08', nombre: 'El Tránsito', departamentoCod: '12' },
  { codigo: '09', nombre: 'Lolotique', departamentoCod: '12' },
  { codigo: '10', nombre: 'Moncagua', departamentoCod: '12' },
  { codigo: '11', nombre: 'Nueva Guadalupe', departamentoCod: '12' },
  { codigo: '12', nombre: 'Nuevo Edén de San Juan', departamentoCod: '12' },
  { codigo: '13', nombre: 'Quelepa', departamentoCod: '12' },
  { codigo: '14', nombre: 'San Antonio', departamentoCod: '12' },
  { codigo: '15', nombre: 'San Gerardo', departamentoCod: '12' },
  { codigo: '16', nombre: 'San Jorge', departamentoCod: '12' },
  { codigo: '17', nombre: 'San Luis de la Reina', departamentoCod: '12' },
  { codigo: '18', nombre: 'San Rafael Oriente', departamentoCod: '12' },
  { codigo: '19', nombre: 'Sesori', departamentoCod: '12' },
  { codigo: '20', nombre: 'Uluazapa', departamentoCod: '12' },

  // Morazán (13) — 26 municipios
  { codigo: '01', nombre: 'San Francisco Gotera', departamentoCod: '13' },
  { codigo: '02', nombre: 'Arambala', departamentoCod: '13' },
  { codigo: '03', nombre: 'Cacaopera', departamentoCod: '13' },
  { codigo: '04', nombre: 'Corinto', departamentoCod: '13' },
  { codigo: '05', nombre: 'Delicias de Concepción', departamentoCod: '13' },
  { codigo: '06', nombre: 'El Divisadero', departamentoCod: '13' },
  { codigo: '07', nombre: 'El Rosario', departamentoCod: '13' },
  { codigo: '08', nombre: 'Gualococti', departamentoCod: '13' },
  { codigo: '09', nombre: 'Guatajiagua', departamentoCod: '13' },
  { codigo: '10', nombre: 'Joateca', departamentoCod: '13' },
  { codigo: '11', nombre: 'Jocoaitique', departamentoCod: '13' },
  { codigo: '12', nombre: 'Jocoro', departamentoCod: '13' },
  { codigo: '13', nombre: 'Lolotiquillo', departamentoCod: '13' },
  { codigo: '14', nombre: 'Meanguera', departamentoCod: '13' },
  { codigo: '15', nombre: 'Osicala', departamentoCod: '13' },
  { codigo: '16', nombre: 'Perquín', departamentoCod: '13' },
  { codigo: '17', nombre: 'San Carlos', departamentoCod: '13' },
  { codigo: '18', nombre: 'San Fernando', departamentoCod: '13' },
  { codigo: '19', nombre: 'San Isidro', departamentoCod: '13' },
  { codigo: '20', nombre: 'San Simón', departamentoCod: '13' },
  { codigo: '21', nombre: 'Sensembra', departamentoCod: '13' },
  { codigo: '22', nombre: 'Sociedad', departamentoCod: '13' },
  { codigo: '23', nombre: 'Torola', departamentoCod: '13' },
  { codigo: '24', nombre: 'Yamabal', departamentoCod: '13' },
  { codigo: '25', nombre: 'Yoloaiquín', departamentoCod: '13' },
  { codigo: '26', nombre: 'Chilanga', departamentoCod: '13' },

  // La Unión (14) — 18 municipios
  { codigo: '01', nombre: 'La Unión', departamentoCod: '14' },
  { codigo: '02', nombre: 'Anamorós', departamentoCod: '14' },
  { codigo: '03', nombre: 'Bolívar', departamentoCod: '14' },
  { codigo: '04', nombre: 'Concepción de Oriente', departamentoCod: '14' },
  { codigo: '05', nombre: 'Conchagua', departamentoCod: '14' },
  { codigo: '06', nombre: 'El Carmen', departamentoCod: '14' },
  { codigo: '07', nombre: 'El Sauce', departamentoCod: '14' },
  { codigo: '08', nombre: 'Intipucá', departamentoCod: '14' },
  { codigo: '09', nombre: 'Lislique', departamentoCod: '14' },
  { codigo: '10', nombre: 'Meanguera del Golfo', departamentoCod: '14' },
  { codigo: '11', nombre: 'Nueva Esparta', departamentoCod: '14' },
  { codigo: '12', nombre: 'Pasaquina', departamentoCod: '14' },
  { codigo: '13', nombre: 'Polorós', departamentoCod: '14' },
  { codigo: '14', nombre: 'San Alejo', departamentoCod: '14' },
  { codigo: '15', nombre: 'San José', departamentoCod: '14' },
  { codigo: '16', nombre: 'Santa Rosa de Lima', departamentoCod: '14' },
  { codigo: '17', nombre: 'Yayantique', departamentoCod: '14' },
  { codigo: '18', nombre: 'Yucuaiquín', departamentoCod: '14' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

export function getMunicipiosByDepto(departamentoCod: string): Municipio[] {
  return MUNICIPIOS.filter(m => m.departamentoCod === departamentoCod);
}

export function getDepartamentoNombre(codigo: string): string {
  return DEPARTAMENTOS.find(d => d.codigo === codigo)?.nombre ?? codigo;
}

export function getMunicipioNombre(departamentoCod: string, municipioCod: string): string {
  return MUNICIPIOS.find(m => m.departamentoCod === departamentoCod && m.codigo === municipioCod)?.nombre ?? municipioCod;
}
