-- MySQL dump 10.13  Distrib 8.0.36, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: uni_tracking
-- ------------------------------------------------------
-- Server version	5.5.5-10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `asistencias`
--

DROP TABLE IF EXISTS `asistencias`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `asistencias` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `estudiante_id` int(11) NOT NULL,
  `materia_id` int(11) NOT NULL,
  `fecha` date NOT NULL,
  `estado` enum('presente','falta','permiso','tarde') NOT NULL,
  `justificacion` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_asistencia` (`estudiante_id`,`materia_id`,`fecha`),
  KEY `materia_id` (`materia_id`),
  CONSTRAINT `asistencias_ibfk_1` FOREIGN KEY (`estudiante_id`) REFERENCES `estudiantes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `asistencias_ibfk_2` FOREIGN KEY (`materia_id`) REFERENCES `materias` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=239 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `asistencias`
--

LOCK TABLES `asistencias` WRITE;
/*!40000 ALTER TABLE `asistencias` DISABLE KEYS */;
INSERT INTO `asistencias` VALUES (8,35,16,'2026-04-19','falta',NULL,'2026-04-19 19:48:05'),(9,36,16,'2026-04-19','presente',NULL,'2026-04-19 19:48:05'),(10,37,16,'2026-04-19','presente',NULL,'2026-04-19 19:48:05'),(11,38,16,'2026-04-19','tarde',NULL,'2026-04-19 19:48:05'),(12,39,16,'2026-04-19','permiso',NULL,'2026-04-19 19:48:05'),(13,40,16,'2026-04-19','permiso',NULL,'2026-04-19 19:48:05'),(14,41,16,'2026-04-19','permiso',NULL,'2026-04-19 19:48:05'),(15,42,16,'2026-04-19','presente',NULL,'2026-04-19 19:48:05'),(16,43,16,'2026-04-19','presente',NULL,'2026-04-19 19:48:05'),(17,44,16,'2026-04-19','presente',NULL,'2026-04-19 19:48:05'),(18,45,16,'2026-04-19','presente',NULL,'2026-04-19 19:48:05'),(19,46,16,'2026-04-19','presente',NULL,'2026-04-19 19:48:05'),(20,47,16,'2026-04-19','presente',NULL,'2026-04-19 19:48:05'),(21,48,16,'2026-04-19','presente',NULL,'2026-04-19 19:48:05'),(22,49,16,'2026-04-19','presente',NULL,'2026-04-19 19:48:05'),(23,50,16,'2026-04-19','presente',NULL,'2026-04-19 19:48:05'),(24,51,16,'2026-04-19','presente',NULL,'2026-04-19 19:48:05'),(25,52,16,'2026-04-19','presente',NULL,'2026-04-19 19:48:05'),(26,53,16,'2026-04-19','presente',NULL,'2026-04-19 19:48:05'),(27,54,16,'2026-04-19','presente',NULL,'2026-04-19 19:48:05'),(28,55,16,'2026-04-19','presente',NULL,'2026-04-19 19:48:05'),(29,56,16,'2026-04-19','presente',NULL,'2026-04-19 19:48:05'),(30,57,16,'2026-04-19','presente',NULL,'2026-04-19 19:48:05'),(31,58,16,'2026-04-19','presente',NULL,'2026-04-19 19:48:05'),(32,59,16,'2026-04-19','presente',NULL,'2026-04-19 19:48:05'),(33,60,16,'2026-04-19','presente',NULL,'2026-04-19 19:48:05'),(34,61,16,'2026-04-19','presente',NULL,'2026-04-19 19:48:05'),(35,62,16,'2026-04-19','presente',NULL,'2026-04-19 19:48:05'),(36,63,16,'2026-04-19','presente',NULL,'2026-04-19 19:48:05'),(37,64,16,'2026-04-19','presente',NULL,'2026-04-19 19:48:05'),(38,65,16,'2026-04-19','presente',NULL,'2026-04-19 19:48:05'),(39,66,16,'2026-04-19','presente',NULL,'2026-04-19 19:48:05'),(40,67,16,'2026-04-19','presente',NULL,'2026-04-19 19:48:05'),(140,1,15,'2026-04-19','presente',NULL,'2026-04-19 19:52:43'),(141,4,15,'2026-04-19','presente',NULL,'2026-04-19 19:52:43'),(142,35,16,'2026-04-21','presente',NULL,'2026-04-21 12:02:31'),(143,36,16,'2026-04-21','presente',NULL,'2026-04-21 12:02:31'),(144,37,16,'2026-04-21','falta',NULL,'2026-04-21 12:02:31'),(145,38,16,'2026-04-21','presente',NULL,'2026-04-21 12:02:31'),(146,39,16,'2026-04-21','presente',NULL,'2026-04-21 12:02:31'),(147,40,16,'2026-04-21','falta',NULL,'2026-04-21 12:02:31'),(148,41,16,'2026-04-21','presente',NULL,'2026-04-21 12:02:31'),(149,42,16,'2026-04-21','presente',NULL,'2026-04-21 12:02:31'),(150,43,16,'2026-04-21','falta',NULL,'2026-04-21 12:02:31'),(151,44,16,'2026-04-21','falta',NULL,'2026-04-21 12:02:31'),(152,45,16,'2026-04-21','presente',NULL,'2026-04-21 12:02:31'),(153,46,16,'2026-04-21','presente',NULL,'2026-04-21 12:02:31'),(154,47,16,'2026-04-21','presente',NULL,'2026-04-21 12:02:31'),(155,48,16,'2026-04-21','falta',NULL,'2026-04-21 12:02:31'),(156,49,16,'2026-04-21','presente',NULL,'2026-04-21 12:02:31'),(157,50,16,'2026-04-21','presente',NULL,'2026-04-21 12:02:31'),(158,51,16,'2026-04-21','falta',NULL,'2026-04-21 12:02:31'),(159,52,16,'2026-04-21','falta',NULL,'2026-04-21 12:02:31'),(160,53,16,'2026-04-21','presente',NULL,'2026-04-21 12:02:31'),(161,54,16,'2026-04-21','presente',NULL,'2026-04-21 12:02:31'),(162,55,16,'2026-04-21','falta',NULL,'2026-04-21 12:02:31'),(163,56,16,'2026-04-21','falta',NULL,'2026-04-21 12:02:31'),(164,57,16,'2026-04-21','presente',NULL,'2026-04-21 12:02:31'),(165,58,16,'2026-04-21','presente',NULL,'2026-04-21 12:02:31'),(166,59,16,'2026-04-21','presente',NULL,'2026-04-21 12:02:31'),(167,60,16,'2026-04-21','presente',NULL,'2026-04-21 12:02:31'),(168,61,16,'2026-04-21','falta',NULL,'2026-04-21 12:02:31'),(169,62,16,'2026-04-21','presente',NULL,'2026-04-21 12:02:31'),(170,63,16,'2026-04-21','falta',NULL,'2026-04-21 12:02:31'),(171,64,16,'2026-04-21','presente',NULL,'2026-04-21 12:02:31'),(172,65,16,'2026-04-21','falta',NULL,'2026-04-21 12:02:31'),(173,66,16,'2026-04-21','presente',NULL,'2026-04-21 12:02:31'),(174,67,16,'2026-04-21','presente',NULL,'2026-04-21 12:02:31'),(175,1,15,'2026-04-21','falta',NULL,'2026-04-21 13:35:22'),(176,4,15,'2026-04-21','presente',NULL,'2026-04-21 13:35:22'),(177,5,15,'2026-04-21','presente',NULL,'2026-04-21 13:35:22'),(178,6,15,'2026-04-21','presente',NULL,'2026-04-21 13:35:22'),(179,7,15,'2026-04-21','presente',NULL,'2026-04-21 13:35:22'),(180,8,15,'2026-04-21','presente',NULL,'2026-04-21 13:35:22'),(181,9,15,'2026-04-21','presente',NULL,'2026-04-21 13:35:22'),(182,10,15,'2026-04-21','presente',NULL,'2026-04-21 13:35:22'),(183,11,15,'2026-04-21','presente',NULL,'2026-04-21 13:35:22'),(184,12,15,'2026-04-21','presente',NULL,'2026-04-21 13:35:22'),(185,13,15,'2026-04-21','presente',NULL,'2026-04-21 13:35:22'),(186,14,15,'2026-04-21','falta',NULL,'2026-04-21 13:35:22'),(187,15,15,'2026-04-21','presente',NULL,'2026-04-21 13:35:22'),(188,16,15,'2026-04-21','falta',NULL,'2026-04-21 13:35:22'),(189,17,15,'2026-04-21','presente',NULL,'2026-04-21 13:35:22'),(190,18,15,'2026-04-21','presente',NULL,'2026-04-21 13:35:22'),(191,19,15,'2026-04-21','presente',NULL,'2026-04-21 13:35:22'),(192,20,15,'2026-04-21','falta',NULL,'2026-04-21 13:35:22'),(193,21,15,'2026-04-21','presente',NULL,'2026-04-21 13:35:22'),(194,22,15,'2026-04-21','presente',NULL,'2026-04-21 13:35:22'),(195,23,15,'2026-04-21','presente',NULL,'2026-04-21 13:35:22'),(196,24,15,'2026-04-21','falta',NULL,'2026-04-21 13:35:22'),(197,25,15,'2026-04-21','presente',NULL,'2026-04-21 13:35:22'),(198,26,15,'2026-04-21','presente',NULL,'2026-04-21 13:35:22'),(199,27,15,'2026-04-21','falta',NULL,'2026-04-21 13:35:22'),(200,28,15,'2026-04-21','presente',NULL,'2026-04-21 13:35:22'),(201,29,15,'2026-04-21','presente',NULL,'2026-04-21 13:35:22'),(202,30,15,'2026-04-21','falta',NULL,'2026-04-21 13:35:22'),(203,31,15,'2026-04-21','falta',NULL,'2026-04-21 13:35:22'),(204,32,15,'2026-04-21','presente',NULL,'2026-04-21 13:35:22'),(205,33,15,'2026-04-21','presente',NULL,'2026-04-21 13:35:22'),(206,34,15,'2026-04-21','presente',NULL,'2026-04-21 13:35:22');
/*!40000 ALTER TABLE `asistencias` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `avance_materia`
--

DROP TABLE IF EXISTS `avance_materia`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `avance_materia` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `materia_id` int(11) NOT NULL,
  `docente_id` int(11) NOT NULL,
  `tema` varchar(200) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `porcentaje_avance` decimal(5,2) DEFAULT 0.00,
  `fecha` date NOT NULL,
  `validado` tinyint(1) DEFAULT 0,
  `validado_por` int(11) DEFAULT NULL,
  `fecha_validacion` timestamp NULL DEFAULT NULL,
  `observaciones` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `materia_id` (`materia_id`),
  KEY `docente_id` (`docente_id`),
  KEY `validado_por` (`validado_por`),
  CONSTRAINT `avance_materia_ibfk_1` FOREIGN KEY (`materia_id`) REFERENCES `materias` (`id`) ON DELETE CASCADE,
  CONSTRAINT `avance_materia_ibfk_2` FOREIGN KEY (`docente_id`) REFERENCES `docentes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `avance_materia_ibfk_3` FOREIGN KEY (`validado_por`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `avance_materia`
--

LOCK TABLES `avance_materia` WRITE;
/*!40000 ALTER TABLE `avance_materia` DISABLE KEYS */;
INSERT INTO `avance_materia` VALUES (4,15,3,'Historia del computador','Contenido del PGO completado - Unidad I: FUNDAMENTOS DE COMPUTADORES',7.69,'2026-04-19',0,NULL,NULL,NULL,'2026-04-19 21:18:47'),(5,15,3,'Aritmética del computador (Sistemas numéricos , Representación binaria , Aritmética binaria)','Contenido del PGO completado - Unidad I: FUNDAMENTOS DE COMPUTADORES',15.38,'2026-04-19',0,NULL,NULL,NULL,'2026-04-19 21:18:51');
/*!40000 ALTER TABLE `avance_materia` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `carreras`
--

DROP TABLE IF EXISTS `carreras`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `carreras` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(150) NOT NULL,
  `codigo` varchar(20) NOT NULL,
  `jefe_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `codigo` (`codigo`),
  KEY `jefe_id` (`jefe_id`),
  CONSTRAINT `carreras_ibfk_1` FOREIGN KEY (`jefe_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `carreras`
--

LOCK TABLES `carreras` WRITE;
/*!40000 ALTER TABLE `carreras` DISABLE KEYS */;
INSERT INTO `carreras` VALUES (1,'Ingeniería de Sistemas','ISI',2),(2,'Inteligencia Artificial','IDIA',8);
/*!40000 ALTER TABLE `carreras` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `comentarios_estudiantes`
--

DROP TABLE IF EXISTS `comentarios_estudiantes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `comentarios_estudiantes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `estudiante_id` int(11) NOT NULL,
  `docente_id` int(11) NOT NULL,
  `materia_id` int(11) DEFAULT NULL,
  `tipo` enum('positivo','observacion','alerta','felicitacion') DEFAULT 'observacion',
  `comentario` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `estudiante_id` (`estudiante_id`),
  KEY `docente_id` (`docente_id`),
  KEY `materia_id` (`materia_id`),
  CONSTRAINT `comentarios_estudiantes_ibfk_1` FOREIGN KEY (`estudiante_id`) REFERENCES `estudiantes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `comentarios_estudiantes_ibfk_2` FOREIGN KEY (`docente_id`) REFERENCES `docentes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `comentarios_estudiantes_ibfk_3` FOREIGN KEY (`materia_id`) REFERENCES `materias` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `comentarios_estudiantes`
--

LOCK TABLES `comentarios_estudiantes` WRITE;
/*!40000 ALTER TABLE `comentarios_estudiantes` DISABLE KEYS */;
INSERT INTO `comentarios_estudiantes` VALUES (1,1,1,NULL,'felicitacion','Excelente participación en clase y entrega de proyectos.','2026-04-19 15:27:38'),(2,2,1,NULL,'observacion','Debe mejorar la puntualidad en las entregas.','2026-04-19 15:27:38'),(3,3,1,NULL,'alerta','Ha faltado varios días consecutivos, requiere seguimiento.','2026-04-19 15:27:38');
/*!40000 ALTER TABLE `comentarios_estudiantes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cursos_capacitacion`
--

DROP TABLE IF EXISTS `cursos_capacitacion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cursos_capacitacion` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `estudiante_id` int(11) NOT NULL,
  `nombre_curso` varchar(200) NOT NULL,
  `institucion` varchar(200) DEFAULT NULL,
  `fecha_inicio` date DEFAULT NULL,
  `fecha_fin` date DEFAULT NULL,
  `horas` int(11) DEFAULT NULL,
  `certificado_url` varchar(500) DEFAULT NULL,
  `descripcion` text DEFAULT NULL,
  `estado` enum('pendiente','aprobado','rechazado') DEFAULT 'pendiente',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `estudiante_id` (`estudiante_id`),
  CONSTRAINT `cursos_capacitacion_ibfk_1` FOREIGN KEY (`estudiante_id`) REFERENCES `estudiantes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cursos_capacitacion`
--

LOCK TABLES `cursos_capacitacion` WRITE;
/*!40000 ALTER TABLE `cursos_capacitacion` DISABLE KEYS */;
INSERT INTO `cursos_capacitacion` VALUES (1,1,'React Avanzado','Platzi','2026-01-15','2026-02-28',40,NULL,NULL,'aprobado','2026-04-19 15:27:38'),(2,2,'Docker y Kubernetes','Udemy','2026-02-01','2026-03-15',60,NULL,NULL,'pendiente','2026-04-19 15:27:38'),(3,1,'React Avanzado','Platzi','2026-01-15','2026-02-28',40,NULL,NULL,'aprobado','2026-04-19 15:27:38'),(4,2,'Docker y Kubernetes','Udemy','2026-02-01','2026-03-15',60,NULL,NULL,'pendiente','2026-04-19 15:27:38');
/*!40000 ALTER TABLE `cursos_capacitacion` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `disciplina_docentes`
--

DROP TABLE IF EXISTS `disciplina_docentes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `disciplina_docentes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tipo` enum('falta','sancion','permiso') NOT NULL,
  `docente_id` int(11) NOT NULL,
  `materia_id` int(11) DEFAULT NULL,
  `fecha` date NOT NULL,
  `descripcion` text NOT NULL,
  `registrado_por` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `docente_id` (`docente_id`),
  KEY `materia_id` (`materia_id`),
  KEY `registrado_por` (`registrado_por`),
  CONSTRAINT `disciplina_docentes_ibfk_1` FOREIGN KEY (`docente_id`) REFERENCES `docentes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `disciplina_docentes_ibfk_2` FOREIGN KEY (`materia_id`) REFERENCES `materias` (`id`) ON DELETE SET NULL,
  CONSTRAINT `disciplina_docentes_ibfk_3` FOREIGN KEY (`registrado_por`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `disciplina_docentes`
--

LOCK TABLES `disciplina_docentes` WRITE;
/*!40000 ALTER TABLE `disciplina_docentes` DISABLE KEYS */;
INSERT INTO `disciplina_docentes` VALUES (1,'permiso',1,NULL,'2026-04-12','Permiso por capacitación docente externa',2,'2026-04-19 15:27:38');
/*!40000 ALTER TABLE `disciplina_docentes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `disciplina_estudiantes`
--

DROP TABLE IF EXISTS `disciplina_estudiantes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `disciplina_estudiantes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tipo` enum('falta','sancion','permiso') NOT NULL,
  `estudiante_id` int(11) NOT NULL,
  `materia_id` int(11) DEFAULT NULL,
  `fecha` date NOT NULL,
  `descripcion` text NOT NULL,
  `registrado_por` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `estudiante_id` (`estudiante_id`),
  KEY `materia_id` (`materia_id`),
  KEY `registrado_por` (`registrado_por`),
  CONSTRAINT `disciplina_estudiantes_ibfk_1` FOREIGN KEY (`estudiante_id`) REFERENCES `estudiantes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `disciplina_estudiantes_ibfk_2` FOREIGN KEY (`materia_id`) REFERENCES `materias` (`id`) ON DELETE SET NULL,
  CONSTRAINT `disciplina_estudiantes_ibfk_3` FOREIGN KEY (`registrado_por`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `disciplina_estudiantes`
--

LOCK TABLES `disciplina_estudiantes` WRITE;
/*!40000 ALTER TABLE `disciplina_estudiantes` DISABLE KEYS */;
INSERT INTO `disciplina_estudiantes` VALUES (1,'sancion',1,NULL,'2026-04-10','Uso de celular durante el examen',2,'2026-04-19 15:27:38'),(2,'permiso',3,NULL,'2026-04-15','Cita médica presentada con justificativo',2,'2026-04-19 15:27:38'),(3,'falta',27,NULL,'2026-04-18','Hostigamiento',8,'2026-04-19 20:45:14');
/*!40000 ALTER TABLE `disciplina_estudiantes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `docentes`
--

DROP TABLE IF EXISTS `docentes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `docentes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `usuario_id` int(11) NOT NULL,
  `especialidad` varchar(200) DEFAULT NULL,
  `titulo` varchar(150) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `usuario_id` (`usuario_id`),
  CONSTRAINT `docentes_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `docentes`
--

LOCK TABLES `docentes` WRITE;
/*!40000 ALTER TABLE `docentes` DISABLE KEYS */;
INSERT INTO `docentes` VALUES (1,3,'Desarrollo de Software','MSc. en Ciencias de la Computación'),(2,4,'Bases de Datos','Ing. en Sistemas'),(3,9,'Desarrollo de Software','Dr.h.c. Ing'),(4,74,'Idiomas','Lic'),(5,75,'Programacion','Lic'),(6,76,'Emprendimiento','Mgr'),(7,77,'Estructuras','Lic'),(8,78,'Analisis de Datos','Lic');
/*!40000 ALTER TABLE `docentes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `estudiantes`
--

DROP TABLE IF EXISTS `estudiantes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `estudiantes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `usuario_id` int(11) NOT NULL,
  `carrera_id` int(11) DEFAULT NULL,
  `semestre` int(11) DEFAULT 1,
  `codigo_estudiante` varchar(30) DEFAULT NULL,
  `fecha_ingreso` date DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `usuario_id` (`usuario_id`),
  UNIQUE KEY `codigo_estudiante` (`codigo_estudiante`),
  KEY `carrera_id` (`carrera_id`),
  CONSTRAINT `estudiantes_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  CONSTRAINT `estudiantes_ibfk_2` FOREIGN KEY (`carrera_id`) REFERENCES `carreras` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=68 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `estudiantes`
--

LOCK TABLES `estudiantes` WRITE;
/*!40000 ALTER TABLE `estudiantes` DISABLE KEYS */;
INSERT INTO `estudiantes` VALUES (1,5,2,1,'EST-2026-001','2023-02-01'),(2,6,1,5,'EST-2023-002','2023-02-01'),(3,7,1,3,'EST-2024-003','2024-02-01'),(4,10,2,1,'34008','2026-04-19'),(5,11,2,1,'33946','2026-04-19'),(6,12,2,1,'33858','2026-04-19'),(7,13,2,1,'31713','2026-04-19'),(8,14,2,1,'34237','2026-04-19'),(9,15,2,1,'34428','2026-04-19'),(10,16,2,1,'34261','2026-04-19'),(11,17,2,1,'33903','2026-04-19'),(12,18,2,1,'34240','2026-04-19'),(13,19,2,1,'35094','2026-04-19'),(14,20,2,1,'34105','2026-04-19'),(15,21,2,1,'34823','2026-04-19'),(16,22,2,1,'34325','2026-04-19'),(17,23,2,1,'35672','2026-04-19'),(18,24,2,1,'33769','2026-04-19'),(19,25,2,1,'34076','2026-04-19'),(20,26,2,1,'26807','2026-04-19'),(21,27,2,1,'35632','2026-04-19'),(22,28,2,1,'34561','2026-04-19'),(23,29,2,1,'33844','2026-04-19'),(24,30,2,1,'22718','2026-04-19'),(25,31,2,1,'34857','2026-04-19'),(26,32,2,1,'33972','2026-04-19'),(27,33,2,1,'21195','2026-04-19'),(28,34,2,1,'35573','2026-04-19'),(29,35,2,1,'33948','2026-04-19'),(30,36,2,1,'35866','2026-04-19'),(31,37,2,1,'33790','2026-04-19'),(32,38,2,1,'33770','2026-04-19'),(33,39,2,1,'33900','2026-04-19'),(34,40,2,1,'35018','2026-04-19'),(35,41,2,1,'34067','2026-04-26'),(36,42,2,1,'33871','2026-04-26'),(37,43,2,1,'36001','2026-04-26'),(38,44,2,1,'33924','2026-04-26'),(39,45,2,1,'36023','2026-04-26'),(40,46,2,1,'35750','2026-04-26'),(41,47,2,1,'33860','2026-04-26'),(42,48,2,1,'35635','2026-04-26'),(43,49,2,1,'33816','2026-04-26'),(44,50,2,1,'36055','2026-04-26'),(45,51,2,1,'35588','2026-04-26'),(46,52,2,1,'33854','2026-04-26'),(47,53,2,1,'34111','2026-04-26'),(48,54,2,1,'35910','2026-04-26'),(49,55,2,1,'35000','2026-04-26'),(50,56,2,1,'34932','2026-04-26'),(51,57,2,1,'34537','2026-04-26'),(52,58,2,1,'33845','2026-04-26'),(53,59,2,1,'35405','2026-04-26'),(54,60,2,1,'34239','2026-04-26'),(55,61,2,1,'35101','2026-04-26'),(56,62,2,1,'22715','2026-04-26'),(57,63,2,1,'35809','2026-04-26'),(58,64,2,1,'35158','2026-04-26'),(59,65,2,1,'20023','2026-04-26'),(60,66,2,1,'35670','2026-04-26'),(61,67,2,1,'33765','2026-04-26'),(62,68,2,1,'35701','2026-04-26'),(63,69,2,1,'35444','2026-04-26'),(64,70,2,1,'35517','2026-04-26'),(65,71,2,1,'35964','2026-04-26'),(66,72,2,1,'33795','2026-04-26'),(67,73,2,1,'35967','2026-04-26');
/*!40000 ALTER TABLE `estudiantes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `horarios`
--

DROP TABLE IF EXISTS `horarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `horarios` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `materia_id` int(11) NOT NULL,
  `docente_id` int(11) NOT NULL,
  `dia_semana` enum('Lunes','Martes','Miércoles','Jueves','Viernes','Sábado') NOT NULL,
  `hora_inicio` time NOT NULL,
  `hora_fin` time NOT NULL,
  `aula` varchar(50) DEFAULT NULL,
  `periodo` varchar(50) DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `materia_id` (`materia_id`),
  KEY `docente_id` (`docente_id`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `horarios_ibfk_1` FOREIGN KEY (`materia_id`) REFERENCES `materias` (`id`) ON DELETE CASCADE,
  CONSTRAINT `horarios_ibfk_2` FOREIGN KEY (`docente_id`) REFERENCES `docentes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `horarios_ibfk_3` FOREIGN KEY (`created_by`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `horarios`
--

LOCK TABLES `horarios` WRITE;
/*!40000 ALTER TABLE `horarios` DISABLE KEYS */;
/*!40000 ALTER TABLE `horarios` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inscripciones`
--

DROP TABLE IF EXISTS `inscripciones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `inscripciones` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `estudiante_id` int(11) NOT NULL,
  `materia_id` int(11) NOT NULL,
  `fecha_inscripcion` date DEFAULT curdate(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_inscripcion` (`estudiante_id`,`materia_id`),
  KEY `materia_id` (`materia_id`),
  CONSTRAINT `inscripciones_ibfk_1` FOREIGN KEY (`estudiante_id`) REFERENCES `estudiantes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `inscripciones_ibfk_2` FOREIGN KEY (`materia_id`) REFERENCES `materias` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=957 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inscripciones`
--

LOCK TABLES `inscripciones` WRITE;
/*!40000 ALTER TABLE `inscripciones` DISABLE KEYS */;
INSERT INTO `inscripciones` VALUES (7,1,4,'2026-04-19'),(10,1,10,'2026-04-19'),(11,1,13,'2026-04-19'),(12,1,15,'2026-04-19'),(13,4,4,'2026-04-19'),(14,5,4,'2026-04-19'),(15,6,4,'2026-04-19'),(16,7,4,'2026-04-19'),(17,8,4,'2026-04-19'),(18,9,4,'2026-04-19'),(19,10,4,'2026-04-19'),(20,11,4,'2026-04-19'),(21,12,4,'2026-04-19'),(22,13,4,'2026-04-19'),(23,14,4,'2026-04-19'),(24,15,4,'2026-04-19'),(25,16,4,'2026-04-19'),(26,17,4,'2026-04-19'),(27,18,4,'2026-04-19'),(28,19,4,'2026-04-19'),(29,20,4,'2026-04-19'),(30,21,4,'2026-04-19'),(31,22,4,'2026-04-19'),(32,23,4,'2026-04-19'),(33,24,4,'2026-04-19'),(34,25,4,'2026-04-19'),(35,26,4,'2026-04-19'),(36,27,4,'2026-04-19'),(37,28,4,'2026-04-19'),(38,29,4,'2026-04-19'),(39,30,4,'2026-04-19'),(40,31,4,'2026-04-19'),(41,32,4,'2026-04-19'),(42,33,4,'2026-04-19'),(43,34,4,'2026-04-19'),(44,35,6,'2026-04-19'),(45,35,5,'2026-04-19'),(47,35,12,'2026-04-19'),(48,35,14,'2026-04-19'),(49,35,16,'2026-04-19'),(50,36,6,'2026-04-19'),(51,36,5,'2026-04-19'),(53,36,12,'2026-04-19'),(54,36,14,'2026-04-19'),(55,36,16,'2026-04-19'),(56,37,6,'2026-04-19'),(57,37,5,'2026-04-19'),(59,37,12,'2026-04-19'),(60,37,14,'2026-04-19'),(61,37,16,'2026-04-19'),(62,38,6,'2026-04-19'),(63,38,5,'2026-04-19'),(65,38,12,'2026-04-19'),(66,38,14,'2026-04-19'),(67,38,16,'2026-04-19'),(68,39,6,'2026-04-19'),(69,39,5,'2026-04-19'),(71,39,12,'2026-04-19'),(72,39,14,'2026-04-19'),(73,39,16,'2026-04-19'),(74,40,6,'2026-04-19'),(75,40,5,'2026-04-19'),(77,40,12,'2026-04-19'),(78,40,14,'2026-04-19'),(79,40,16,'2026-04-19'),(80,41,6,'2026-04-19'),(81,41,5,'2026-04-19'),(83,41,12,'2026-04-19'),(84,41,14,'2026-04-19'),(85,41,16,'2026-04-19'),(86,42,6,'2026-04-19'),(87,42,5,'2026-04-19'),(89,42,12,'2026-04-19'),(90,42,14,'2026-04-19'),(91,42,16,'2026-04-19'),(92,43,6,'2026-04-19'),(93,43,5,'2026-04-19'),(95,43,12,'2026-04-19'),(96,43,14,'2026-04-19'),(97,43,16,'2026-04-19'),(98,44,6,'2026-04-19'),(99,44,5,'2026-04-19'),(101,44,12,'2026-04-19'),(102,44,14,'2026-04-19'),(103,44,16,'2026-04-19'),(104,45,6,'2026-04-19'),(105,45,5,'2026-04-19'),(107,45,12,'2026-04-19'),(108,45,14,'2026-04-19'),(109,45,16,'2026-04-19'),(110,46,6,'2026-04-19'),(111,46,5,'2026-04-19'),(113,46,12,'2026-04-19'),(114,46,14,'2026-04-19'),(115,46,16,'2026-04-19'),(116,47,6,'2026-04-19'),(117,47,5,'2026-04-19'),(119,47,12,'2026-04-19'),(120,47,14,'2026-04-19'),(121,47,16,'2026-04-19'),(122,48,6,'2026-04-19'),(123,48,5,'2026-04-19'),(125,48,12,'2026-04-19'),(126,48,14,'2026-04-19'),(127,48,16,'2026-04-19'),(128,49,6,'2026-04-19'),(129,49,5,'2026-04-19'),(131,49,12,'2026-04-19'),(132,49,14,'2026-04-19'),(133,49,16,'2026-04-19'),(134,50,6,'2026-04-19'),(135,50,5,'2026-04-19'),(137,50,12,'2026-04-19'),(138,50,14,'2026-04-19'),(139,50,16,'2026-04-19'),(140,51,6,'2026-04-19'),(141,51,5,'2026-04-19'),(143,51,12,'2026-04-19'),(144,51,14,'2026-04-19'),(145,51,16,'2026-04-19'),(146,52,6,'2026-04-19'),(147,52,5,'2026-04-19'),(149,52,12,'2026-04-19'),(150,52,14,'2026-04-19'),(151,52,16,'2026-04-19'),(152,53,6,'2026-04-19'),(153,53,5,'2026-04-19'),(155,53,12,'2026-04-19'),(156,53,14,'2026-04-19'),(157,53,16,'2026-04-19'),(158,54,6,'2026-04-19'),(159,54,5,'2026-04-19'),(161,54,12,'2026-04-19'),(162,54,14,'2026-04-19'),(163,54,16,'2026-04-19'),(164,55,6,'2026-04-19'),(165,55,5,'2026-04-19'),(167,55,12,'2026-04-19'),(168,55,14,'2026-04-19'),(169,55,16,'2026-04-19'),(170,56,6,'2026-04-19'),(171,56,5,'2026-04-19'),(173,56,12,'2026-04-19'),(174,56,14,'2026-04-19'),(175,56,16,'2026-04-19'),(176,57,6,'2026-04-19'),(177,57,5,'2026-04-19'),(179,57,12,'2026-04-19'),(180,57,14,'2026-04-19'),(181,57,16,'2026-04-19'),(182,58,6,'2026-04-19'),(183,58,5,'2026-04-19'),(185,58,12,'2026-04-19'),(186,58,14,'2026-04-19'),(187,58,16,'2026-04-19'),(188,59,6,'2026-04-19'),(189,59,5,'2026-04-19'),(191,59,12,'2026-04-19'),(192,59,14,'2026-04-19'),(193,59,16,'2026-04-19'),(194,60,6,'2026-04-19'),(195,60,5,'2026-04-19'),(197,60,12,'2026-04-19'),(198,60,14,'2026-04-19'),(199,60,16,'2026-04-19'),(200,61,6,'2026-04-19'),(201,61,5,'2026-04-19'),(203,61,12,'2026-04-19'),(204,61,14,'2026-04-19'),(205,61,16,'2026-04-19'),(206,62,6,'2026-04-19'),(207,62,5,'2026-04-19'),(209,62,12,'2026-04-19'),(210,62,14,'2026-04-19'),(211,62,16,'2026-04-19'),(212,63,6,'2026-04-19'),(213,63,5,'2026-04-19'),(215,63,12,'2026-04-19'),(216,63,14,'2026-04-19'),(217,63,16,'2026-04-19'),(218,64,6,'2026-04-19'),(219,64,5,'2026-04-19'),(221,64,12,'2026-04-19'),(222,64,14,'2026-04-19'),(223,64,16,'2026-04-19'),(224,65,6,'2026-04-19'),(225,65,5,'2026-04-19'),(227,65,12,'2026-04-19'),(228,65,14,'2026-04-19'),(229,65,16,'2026-04-19'),(230,66,6,'2026-04-19'),(231,66,5,'2026-04-19'),(233,66,12,'2026-04-19'),(234,66,14,'2026-04-19'),(235,66,16,'2026-04-19'),(236,67,6,'2026-04-19'),(237,67,5,'2026-04-19'),(239,67,12,'2026-04-19'),(240,67,14,'2026-04-19'),(241,67,16,'2026-04-19'),(242,50,9,'2026-04-19'),(243,4,7,'2026-04-19'),(245,4,10,'2026-04-19'),(246,4,13,'2026-04-19'),(247,4,15,'2026-04-19'),(249,36,9,'2026-04-19'),(250,10,7,'2026-04-19'),(252,5,7,'2026-04-19'),(253,6,7,'2026-04-19'),(254,7,7,'2026-04-19'),(255,8,7,'2026-04-19'),(256,9,7,'2026-04-19'),(258,11,7,'2026-04-19'),(259,12,7,'2026-04-19'),(260,13,7,'2026-04-19'),(261,14,7,'2026-04-19'),(262,15,7,'2026-04-19'),(263,16,7,'2026-04-19'),(264,17,7,'2026-04-19'),(265,18,7,'2026-04-19'),(266,19,7,'2026-04-19'),(267,20,7,'2026-04-19'),(268,21,7,'2026-04-19'),(269,22,7,'2026-04-19'),(270,23,7,'2026-04-19'),(271,24,7,'2026-04-19'),(272,25,7,'2026-04-19'),(273,26,7,'2026-04-19'),(274,27,7,'2026-04-19'),(275,28,7,'2026-04-19'),(276,29,7,'2026-04-19'),(277,30,7,'2026-04-19'),(278,31,7,'2026-04-19'),(279,32,7,'2026-04-19'),(280,33,7,'2026-04-19'),(281,34,7,'2026-04-19'),(283,5,13,'2026-04-19'),(284,6,13,'2026-04-19'),(285,7,13,'2026-04-19'),(286,8,13,'2026-04-19'),(287,9,13,'2026-04-19'),(288,10,13,'2026-04-19'),(289,11,13,'2026-04-19'),(290,12,13,'2026-04-19'),(291,13,13,'2026-04-19'),(292,14,13,'2026-04-19'),(293,15,13,'2026-04-19'),(294,16,13,'2026-04-19'),(295,17,13,'2026-04-19'),(296,18,13,'2026-04-19'),(297,19,13,'2026-04-19'),(298,20,13,'2026-04-19'),(299,21,13,'2026-04-19'),(300,22,13,'2026-04-19'),(301,23,13,'2026-04-19'),(302,24,13,'2026-04-19'),(303,25,13,'2026-04-19'),(304,26,13,'2026-04-19'),(305,27,13,'2026-04-19'),(306,28,13,'2026-04-19'),(307,29,13,'2026-04-19'),(308,30,13,'2026-04-19'),(309,31,13,'2026-04-19'),(310,32,13,'2026-04-19'),(311,33,13,'2026-04-19'),(312,34,13,'2026-04-19'),(346,35,9,'2026-04-19'),(358,37,9,'2026-04-19'),(364,38,9,'2026-04-19'),(370,39,9,'2026-04-19'),(376,40,9,'2026-04-19'),(382,41,9,'2026-04-19'),(388,42,9,'2026-04-19'),(394,43,9,'2026-04-19'),(400,44,9,'2026-04-19'),(406,45,9,'2026-04-19'),(412,46,9,'2026-04-19'),(418,47,9,'2026-04-19'),(424,48,9,'2026-04-19'),(430,49,9,'2026-04-19'),(442,51,9,'2026-04-19'),(448,52,9,'2026-04-19'),(454,53,9,'2026-04-19'),(460,54,9,'2026-04-19'),(466,55,9,'2026-04-19'),(472,56,9,'2026-04-19'),(478,57,9,'2026-04-19'),(484,58,9,'2026-04-19'),(490,59,9,'2026-04-19'),(496,60,9,'2026-04-19'),(502,61,9,'2026-04-19'),(508,62,9,'2026-04-19'),(514,63,9,'2026-04-19'),(520,64,9,'2026-04-19'),(526,65,9,'2026-04-19'),(532,66,9,'2026-04-19'),(538,67,9,'2026-04-19'),(551,5,10,'2026-04-19'),(553,5,15,'2026-04-19'),(557,6,10,'2026-04-19'),(559,6,15,'2026-04-19'),(563,7,10,'2026-04-19'),(565,7,15,'2026-04-19'),(569,8,10,'2026-04-19'),(571,8,15,'2026-04-19'),(575,9,10,'2026-04-19'),(577,9,15,'2026-04-19'),(581,10,10,'2026-04-19'),(583,10,15,'2026-04-19'),(587,11,10,'2026-04-19'),(589,11,15,'2026-04-19'),(593,12,10,'2026-04-19'),(595,12,15,'2026-04-19'),(599,13,10,'2026-04-19'),(601,13,15,'2026-04-19'),(605,14,10,'2026-04-19'),(607,14,15,'2026-04-19'),(611,15,10,'2026-04-19'),(613,15,15,'2026-04-19'),(617,16,10,'2026-04-19'),(619,16,15,'2026-04-19'),(623,17,10,'2026-04-19'),(625,17,15,'2026-04-19'),(629,18,10,'2026-04-19'),(631,18,15,'2026-04-19'),(635,19,10,'2026-04-19'),(637,19,15,'2026-04-19'),(641,20,10,'2026-04-19'),(643,20,15,'2026-04-19'),(647,21,10,'2026-04-19'),(649,21,15,'2026-04-19'),(653,22,10,'2026-04-19'),(655,22,15,'2026-04-19'),(659,23,10,'2026-04-19'),(661,23,15,'2026-04-19'),(665,24,10,'2026-04-19'),(667,24,15,'2026-04-19'),(671,25,10,'2026-04-19'),(673,25,15,'2026-04-19'),(677,26,10,'2026-04-19'),(679,26,15,'2026-04-19'),(683,27,10,'2026-04-19'),(685,27,15,'2026-04-19'),(689,28,10,'2026-04-19'),(691,28,15,'2026-04-19'),(695,29,10,'2026-04-19'),(697,29,15,'2026-04-19'),(701,30,10,'2026-04-19'),(703,30,15,'2026-04-19'),(707,31,10,'2026-04-19'),(709,31,15,'2026-04-19'),(713,32,10,'2026-04-19'),(715,32,15,'2026-04-19'),(719,33,10,'2026-04-19'),(721,33,15,'2026-04-19'),(725,34,10,'2026-04-19'),(727,34,15,'2026-04-19'),(926,4,8,'2026-04-19'),(927,5,8,'2026-04-19'),(928,6,8,'2026-04-19'),(929,7,8,'2026-04-19'),(930,8,8,'2026-04-19'),(931,9,8,'2026-04-19'),(932,10,8,'2026-04-19'),(933,11,8,'2026-04-19'),(934,12,8,'2026-04-19'),(935,13,8,'2026-04-19'),(936,14,8,'2026-04-19'),(937,15,8,'2026-04-19'),(938,16,8,'2026-04-19'),(939,17,8,'2026-04-19'),(940,18,8,'2026-04-19'),(941,19,8,'2026-04-19'),(942,20,8,'2026-04-19'),(943,21,8,'2026-04-19'),(944,22,8,'2026-04-19'),(945,23,8,'2026-04-19'),(946,24,8,'2026-04-19'),(947,25,8,'2026-04-19'),(948,26,8,'2026-04-19'),(949,27,8,'2026-04-19'),(950,28,8,'2026-04-19'),(951,29,8,'2026-04-19'),(952,30,8,'2026-04-19'),(953,31,8,'2026-04-19'),(954,32,8,'2026-04-19'),(955,33,8,'2026-04-19'),(956,34,8,'2026-04-19');
/*!40000 ALTER TABLE `inscripciones` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `materias`
--

DROP TABLE IF EXISTS `materias`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `materias` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(150) NOT NULL,
  `codigo` varchar(30) NOT NULL,
  `grupo` varchar(10) NOT NULL DEFAULT 'A',
  `carrera_id` int(11) NOT NULL,
  `docente_id` int(11) DEFAULT NULL,
  `semestre` int(11) NOT NULL,
  `creditos` int(11) DEFAULT 4,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_codigo_carrera_grupo` (`codigo`,`carrera_id`,`grupo`),
  KEY `carrera_id` (`carrera_id`),
  KEY `docente_id` (`docente_id`),
  CONSTRAINT `materias_ibfk_1` FOREIGN KEY (`carrera_id`) REFERENCES `carreras` (`id`) ON DELETE CASCADE,
  CONSTRAINT `materias_ibfk_2` FOREIGN KEY (`docente_id`) REFERENCES `docentes` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `materias`
--

LOCK TABLES `materias` WRITE;
/*!40000 ALTER TABLE `materias` DISABLE KEYS */;
INSERT INTO `materias` VALUES (4,'Analisis Diferencial e Integral','IA-2411','A',2,8,1,4),(5,'Emprendimiento','LEC-2411','B',2,6,1,4),(6,'Analisis Diferencial e Integral','IA-2411','B',2,8,1,4),(7,'Emprendimiento','LEC-2411','A',2,6,1,4),(8,'ESTRUCTURAS LÓGICAS BÁSICAS','IA-2412','A',2,7,1,4),(9,'ESTRUCTURAS LÓGICAS BÁSICAS','IA-2412','B',2,7,1,4),(10,'INGLÉS I','IA-2413','A',2,4,1,4),(12,'INGLÉS I','IA-2413','B',2,4,1,4),(13,'PROGRAMACIÓN I','IA-2414','A',2,5,1,4),(14,'PROGRAMACIÓN I','IA-2414','B',2,5,1,4),(15,'TECNOLOGÍA DE COMPUTADORES','IA-2415','A',2,3,1,4),(16,'TECNOLOGÍA DE COMPUTADORES','IA-2415','B',2,3,1,4),(17,'Electiva','TEST','A',2,NULL,1,4);
/*!40000 ALTER TABLE `materias` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pgo`
--

DROP TABLE IF EXISTS `pgo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pgo` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `materia_id` int(11) NOT NULL,
  `docente_id` int(11) NOT NULL,
  `titulo` varchar(200) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `archivo_url` varchar(500) DEFAULT NULL,
  `periodo` varchar(50) DEFAULT NULL,
  `estado` enum('borrador','enviado','aprobado','rechazado','revision') DEFAULT 'enviado',
  `observaciones` text DEFAULT NULL,
  `fecha_envio` timestamp NOT NULL DEFAULT current_timestamp(),
  `fecha_revision` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `materia_id` (`materia_id`),
  KEY `docente_id` (`docente_id`),
  CONSTRAINT `pgo_ibfk_1` FOREIGN KEY (`materia_id`) REFERENCES `materias` (`id`) ON DELETE CASCADE,
  CONSTRAINT `pgo_ibfk_2` FOREIGN KEY (`docente_id`) REFERENCES `docentes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pgo`
--

LOCK TABLES `pgo` WRITE;
/*!40000 ALTER TABLE `pgo` DISABLE KEYS */;
/*!40000 ALTER TABLE `pgo` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pgo_tareas`
--

DROP TABLE IF EXISTS `pgo_tareas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pgo_tareas` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `pgo_id` int(11) NOT NULL,
  `materia_id` int(11) NOT NULL,
  `docente_id` int(11) NOT NULL,
  `unidad_codigo` varchar(30) DEFAULT NULL,
  `unidad_nombre` varchar(255) DEFAULT NULL,
  `titulo` varchar(255) NOT NULL,
  `orden` int(11) NOT NULL DEFAULT 1,
  `estado` enum('pendiente','completado') DEFAULT 'pendiente',
  `fecha_completado` date DEFAULT NULL,
  `avance_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `pgo_id` (`pgo_id`),
  KEY `materia_id` (`materia_id`),
  KEY `docente_id` (`docente_id`),
  KEY `avance_id` (`avance_id`),
  CONSTRAINT `pgo_tareas_ibfk_1` FOREIGN KEY (`pgo_id`) REFERENCES `pgo` (`id`) ON DELETE CASCADE,
  CONSTRAINT `pgo_tareas_ibfk_2` FOREIGN KEY (`materia_id`) REFERENCES `materias` (`id`) ON DELETE CASCADE,
  CONSTRAINT `pgo_tareas_ibfk_3` FOREIGN KEY (`docente_id`) REFERENCES `docentes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `pgo_tareas_ibfk_4` FOREIGN KEY (`avance_id`) REFERENCES `avance_materia` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pgo_tareas`
--

LOCK TABLES `pgo_tareas` WRITE;
/*!40000 ALTER TABLE `pgo_tareas` DISABLE KEYS */;
/*!40000 ALTER TABLE `pgo_tareas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuarios`
--

DROP TABLE IF EXISTS `usuarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuarios` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `apellido` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `password` varchar(255) NOT NULL,
  `rol` enum('estudiante','docente','jefe','admin') NOT NULL,
  `ci` varchar(20) DEFAULT NULL,
  `telefono` varchar(30) DEFAULT NULL,
  `foto` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=79 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuarios`
--

LOCK TABLES `usuarios` WRITE;
/*!40000 ALTER TABLE `usuarios` DISABLE KEYS */;
INSERT INTO `usuarios` VALUES (1,'Admin','Sistema','admin@uni.edu','$2b$10$cG2YJZjz9NRYMULZtbXkt.uc6lgK3HmCi09gphxikEwIZYZlov4tq','admin','0000001','70000000',NULL,'2026-04-19 15:27:38'),(2,'Carlos','Mendoza','jefe@uni.edu','$2b$10$cG2YJZjz9NRYMULZtbXkt.uc6lgK3HmCi09gphxikEwIZYZlov4tq','jefe','1234567','70000001',NULL,'2026-04-19 15:27:38'),(3,'María','Rodríguez','docente@uni.edu','$2b$10$cG2YJZjz9NRYMULZtbXkt.uc6lgK3HmCi09gphxikEwIZYZlov4tq','docente','2345678','70000002',NULL,'2026-04-19 15:27:38'),(4,'Juan','Pérez','docente2@uni.edu','$2b$10$cG2YJZjz9NRYMULZtbXkt.uc6lgK3HmCi09gphxikEwIZYZlov4tq','docente','3456789','70000003',NULL,'2026-04-19 15:27:38'),(5,'Ana','García','estudiante@uni.edu','$2b$10$cG2YJZjz9NRYMULZtbXkt.uc6lgK3HmCi09gphxikEwIZYZlov4tq','estudiante','4567890','70000004',NULL,'2026-04-19 15:27:38'),(6,'Luis','Torres','estudiante2@uni.edu','$2b$10$cG2YJZjz9NRYMULZtbXkt.uc6lgK3HmCi09gphxikEwIZYZlov4tq','estudiante','5678901','70000005',NULL,'2026-04-19 15:27:38'),(7,'Sofía','Vargas','estudiante3@uni.edu','$2b$10$cG2YJZjz9NRYMULZtbXkt.uc6lgK3HmCi09gphxikEwIZYZlov4tq','estudiante','6789012','70000006',NULL,'2026-04-19 15:27:38'),(8,'Carlos','Azcarraga','tasajos@gmail.com','$2a$10$DcVxNS/5kx.rU3Fe3ADJr.KgAk8aq3BrOlcLJDPY2rXxSDe0ejm1S','jefe','4947021','70776212',NULL,'2026-04-19 15:33:30'),(9,'Carlos','Azcarraga Esquivel','cazcarraga@chakuy.com','$2a$10$PfWSVKHfaLCDqu3vzXMHWecgm4HLRvVyNOzkMMNllzmdkpJobd.ku','docente','4947021','70776212',NULL,'2026-04-19 16:58:24'),(10,'Wilmar','Alarcon Quintanilla','34008@est.uni.edu','$2a$10$pFDrrhzRYmQn7t/p11evxOIU3dItEh1nWWjDb6002ZhRfSB4gGtHC','estudiante','34008',NULL,NULL,'2026-04-19 19:25:41'),(11,'Humberto Sebastian','Caceres Illanes','33946@est.uni.edu','$2a$10$pFDrrhzRYmQn7t/p11evxOIU3dItEh1nWWjDb6002ZhRfSB4gGtHC','estudiante','33946',NULL,NULL,'2026-04-19 19:25:41'),(12,'Alan Rafael','Colque Huanca','33858@est.uni.edu','$2a$10$pFDrrhzRYmQn7t/p11evxOIU3dItEh1nWWjDb6002ZhRfSB4gGtHC','estudiante','33858',NULL,NULL,'2026-04-19 19:25:41'),(13,'Americo Jesus','Dorado Fuentes','31713@est.uni.edu','$2a$10$pFDrrhzRYmQn7t/p11evxOIU3dItEh1nWWjDb6002ZhRfSB4gGtHC','estudiante','31713',NULL,NULL,'2026-04-19 19:25:41'),(14,'Marco Antonio Deikar','Estrada Rodriguez','34237@est.uni.edu','$2a$10$pFDrrhzRYmQn7t/p11evxOIU3dItEh1nWWjDb6002ZhRfSB4gGtHC','estudiante','34237',NULL,NULL,'2026-04-19 19:25:41'),(15,'Victor Manuel','Faccio Mamani','34428@est.uni.edu','$2a$10$pFDrrhzRYmQn7t/p11evxOIU3dItEh1nWWjDb6002ZhRfSB4gGtHC','estudiante','34428',NULL,NULL,'2026-04-19 19:25:41'),(16,'Andres','Flores Flores','34261@est.uni.edu','$2a$10$pFDrrhzRYmQn7t/p11evxOIU3dItEh1nWWjDb6002ZhRfSB4gGtHC','estudiante','34261',NULL,NULL,'2026-04-19 19:25:41'),(17,'Mayte Abigail','Flores Torrico','33903@est.uni.edu','$2a$10$pFDrrhzRYmQn7t/p11evxOIU3dItEh1nWWjDb6002ZhRfSB4gGtHC','estudiante','33903',NULL,NULL,'2026-04-19 19:25:41'),(18,'David Andres','Franco Pinedo','34240@est.uni.edu','$2a$10$pFDrrhzRYmQn7t/p11evxOIU3dItEh1nWWjDb6002ZhRfSB4gGtHC','estudiante','34240',NULL,NULL,'2026-04-19 19:25:41'),(19,'Karylia','Guerrero Porco','35094@est.uni.edu','$2a$10$pFDrrhzRYmQn7t/p11evxOIU3dItEh1nWWjDb6002ZhRfSB4gGtHC','estudiante','35094',NULL,NULL,'2026-04-19 19:25:41'),(20,'Joshua Orlando','Guillen Anagua','34105@est.uni.edu','$2a$10$pFDrrhzRYmQn7t/p11evxOIU3dItEh1nWWjDb6002ZhRfSB4gGtHC','estudiante','34105',NULL,NULL,'2026-04-19 19:25:41'),(21,'Jamil Jhonatan','Illanes Merida','34823@est.uni.edu','$2a$10$pFDrrhzRYmQn7t/p11evxOIU3dItEh1nWWjDb6002ZhRfSB4gGtHC','estudiante','34823',NULL,NULL,'2026-04-19 19:25:41'),(22,'la Fuente Douglas Kevin','la Fuente','34325@est.uni.edu','$2a$10$pFDrrhzRYmQn7t/p11evxOIU3dItEh1nWWjDb6002ZhRfSB4gGtHC','estudiante','34325',NULL,NULL,'2026-04-19 19:25:41'),(23,'Angel Cristian','Lipa Chuquimia','35672@est.uni.edu','$2a$10$pFDrrhzRYmQn7t/p11evxOIU3dItEh1nWWjDb6002ZhRfSB4gGtHC','estudiante','35672',NULL,NULL,'2026-04-19 19:25:41'),(24,'Daniel','Mamani Nina','33769@est.uni.edu','$2a$10$pFDrrhzRYmQn7t/p11evxOIU3dItEh1nWWjDb6002ZhRfSB4gGtHC','estudiante','33769',NULL,NULL,'2026-04-19 19:25:41'),(25,'Jhovana','Mancera Villca','34076@est.uni.edu','$2a$10$pFDrrhzRYmQn7t/p11evxOIU3dItEh1nWWjDb6002ZhRfSB4gGtHC','estudiante','34076',NULL,NULL,'2026-04-19 19:25:41'),(26,'Oscar Alberto','Olmos Yucra','26807@est.uni.edu','$2a$10$pFDrrhzRYmQn7t/p11evxOIU3dItEh1nWWjDb6002ZhRfSB4gGtHC','estudiante','26807',NULL,NULL,'2026-04-19 19:25:41'),(27,'de Carvalho Thiago','Paes Pereira','35632@est.uni.edu','$2a$10$pFDrrhzRYmQn7t/p11evxOIU3dItEh1nWWjDb6002ZhRfSB4gGtHC','estudiante','35632',NULL,NULL,'2026-04-19 19:25:41'),(28,'Romina','Perez Romero','34561@est.uni.edu','$2a$10$pFDrrhzRYmQn7t/p11evxOIU3dItEh1nWWjDb6002ZhRfSB4gGtHC','estudiante','34561',NULL,NULL,'2026-04-19 19:25:41'),(29,'Ismael','Quiroz Flores','33844@est.uni.edu','$2a$10$pFDrrhzRYmQn7t/p11evxOIU3dItEh1nWWjDb6002ZhRfSB4gGtHC','estudiante','33844',NULL,NULL,'2026-04-19 19:25:41'),(30,'Cristian','Quispe Chambi','22718@est.uni.edu','$2a$10$pFDrrhzRYmQn7t/p11evxOIU3dItEh1nWWjDb6002ZhRfSB4gGtHC','estudiante','22718',NULL,NULL,'2026-04-19 19:25:41'),(31,'Emily Katherin','Revollo Apaza','34857@est.uni.edu','$2a$10$pFDrrhzRYmQn7t/p11evxOIU3dItEh1nWWjDb6002ZhRfSB4gGtHC','estudiante','34857',NULL,NULL,'2026-04-19 19:25:41'),(32,'Jhon Kevin','Reyes Marca','33972@est.uni.edu','$2a$10$pFDrrhzRYmQn7t/p11evxOIU3dItEh1nWWjDb6002ZhRfSB4gGtHC','estudiante','33972',NULL,NULL,'2026-04-19 19:25:41'),(33,'Misael','Rodriguez Garcia','21195@est.uni.edu','$2a$10$pFDrrhzRYmQn7t/p11evxOIU3dItEh1nWWjDb6002ZhRfSB4gGtHC','estudiante','21195',NULL,NULL,'2026-04-19 19:25:41'),(34,'Jheremy Daniel','Rojas Claros','35573@est.uni.edu','$2a$10$pFDrrhzRYmQn7t/p11evxOIU3dItEh1nWWjDb6002ZhRfSB4gGtHC','estudiante','35573',NULL,NULL,'2026-04-19 19:25:41'),(35,'Andree','Soza Balderrama','33948@est.uni.edu','$2a$10$pFDrrhzRYmQn7t/p11evxOIU3dItEh1nWWjDb6002ZhRfSB4gGtHC','estudiante','33948',NULL,NULL,'2026-04-19 19:25:41'),(36,'Derik Johan','Vallejos Camacho','35866@est.uni.edu','$2a$10$pFDrrhzRYmQn7t/p11evxOIU3dItEh1nWWjDb6002ZhRfSB4gGtHC','estudiante','35866',NULL,NULL,'2026-04-19 19:25:41'),(37,'Abdiel Jair','Vasques Romero','33790@est.uni.edu','$2a$10$pFDrrhzRYmQn7t/p11evxOIU3dItEh1nWWjDb6002ZhRfSB4gGtHC','estudiante','33790',NULL,NULL,'2026-04-19 19:25:41'),(38,'Jhery Alexander','Vasquez Rocha','33770@est.uni.edu','$2a$10$pFDrrhzRYmQn7t/p11evxOIU3dItEh1nWWjDb6002ZhRfSB4gGtHC','estudiante','33770',NULL,NULL,'2026-04-19 19:25:41'),(39,'Jhair Mijael','Veizaga Calderon','33900@est.uni.edu','$2a$10$pFDrrhzRYmQn7t/p11evxOIU3dItEh1nWWjDb6002ZhRfSB4gGtHC','estudiante','33900',NULL,NULL,'2026-04-19 19:25:41'),(40,'Sergio','Villegas Buitrago','35018@est.uni.edu','$2a$10$pFDrrhzRYmQn7t/p11evxOIU3dItEh1nWWjDb6002ZhRfSB4gGtHC','estudiante','35018',NULL,NULL,'2026-04-19 19:25:41'),(41,'Cesar','Lopez Julio','34067@est.uni.edu','$2a$10$.5MYojBIqhh9TyBWpl.sKu1whW/MGEX7yFwJRmqFgesiGe4MHfDCy','estudiante','34067',NULL,NULL,'2026-04-19 19:36:16'),(42,'Fabio Ramiro','Arnez Gil','33871@est.uni.edu','$2a$10$.5MYojBIqhh9TyBWpl.sKu1whW/MGEX7yFwJRmqFgesiGe4MHfDCy','estudiante','33871',NULL,NULL,'2026-04-19 19:36:16'),(43,'Rommel Regis','Avila Coronel','36001@est.uni.edu','$2a$10$.5MYojBIqhh9TyBWpl.sKu1whW/MGEX7yFwJRmqFgesiGe4MHfDCy','estudiante','36001',NULL,NULL,'2026-04-19 19:36:16'),(44,'Juan Andres','Barra Garcia','33924@est.uni.edu','$2a$10$.5MYojBIqhh9TyBWpl.sKu1whW/MGEX7yFwJRmqFgesiGe4MHfDCy','estudiante','33924',NULL,NULL,'2026-04-19 19:36:16'),(45,'Pablo Moises','Benito Navarro','36023@est.uni.edu','$2a$10$.5MYojBIqhh9TyBWpl.sKu1whW/MGEX7yFwJRmqFgesiGe4MHfDCy','estudiante','36023',NULL,NULL,'2026-04-19 19:36:16'),(46,'Jhonatan','Burgos Blas','35750@est.uni.edu','$2a$10$.5MYojBIqhh9TyBWpl.sKu1whW/MGEX7yFwJRmqFgesiGe4MHfDCy','estudiante','35750',NULL,NULL,'2026-04-19 19:36:16'),(47,'Maykol Andrei','Castrillo Marcoff','33860@est.uni.edu','$2a$10$.5MYojBIqhh9TyBWpl.sKu1whW/MGEX7yFwJRmqFgesiGe4MHfDCy','estudiante','33860',NULL,NULL,'2026-04-19 19:36:16'),(48,'Vanessa de los Angeles','Centellas Mercado','35635@est.uni.edu','$2a$10$.5MYojBIqhh9TyBWpl.sKu1whW/MGEX7yFwJRmqFgesiGe4MHfDCy','estudiante','35635',NULL,NULL,'2026-04-19 19:36:16'),(49,'Dayan Irene','Colque Calle','33816@est.uni.edu','$2a$10$.5MYojBIqhh9TyBWpl.sKu1whW/MGEX7yFwJRmqFgesiGe4MHfDCy','estudiante','33816',NULL,NULL,'2026-04-19 19:36:16'),(50,'Maria Elena','Colque Rasguido','36055@est.uni.edu','$2a$10$.5MYojBIqhh9TyBWpl.sKu1whW/MGEX7yFwJRmqFgesiGe4MHfDCy','estudiante','36055',NULL,NULL,'2026-04-19 19:36:16'),(51,'Jose Manuel','Conde Montecinos','35588@est.uni.edu','$2a$10$.5MYojBIqhh9TyBWpl.sKu1whW/MGEX7yFwJRmqFgesiGe4MHfDCy','estudiante','35588',NULL,NULL,'2026-04-19 19:36:16'),(52,'Lionel Eros','Costas Malue','33854@est.uni.edu','$2a$10$.5MYojBIqhh9TyBWpl.sKu1whW/MGEX7yFwJRmqFgesiGe4MHfDCy','estudiante','33854',NULL,NULL,'2026-04-19 19:36:16'),(53,'Paola Andrea','Diaz Guzman','34111@est.uni.edu','$2a$10$.5MYojBIqhh9TyBWpl.sKu1whW/MGEX7yFwJRmqFgesiGe4MHfDCy','estudiante','34111',NULL,NULL,'2026-04-19 19:36:16'),(54,'Erick Nelser','Flores Nina','35910@est.uni.edu','$2a$10$.5MYojBIqhh9TyBWpl.sKu1whW/MGEX7yFwJRmqFgesiGe4MHfDCy','estudiante','35910',NULL,NULL,'2026-04-19 19:36:16'),(55,'Carlos David','Flores Goyonaga','35000@est.uni.edu','$2a$10$.5MYojBIqhh9TyBWpl.sKu1whW/MGEX7yFwJRmqFgesiGe4MHfDCy','estudiante','35000',NULL,NULL,'2026-04-19 19:36:16'),(56,'Julia Tatiana','Frias Huanca','34932@est.uni.edu','$2a$10$.5MYojBIqhh9TyBWpl.sKu1whW/MGEX7yFwJRmqFgesiGe4MHfDCy','estudiante','34932',NULL,NULL,'2026-04-19 19:36:16'),(57,'Deneth Darkmark','Fuentes Mamani','34537@est.uni.edu','$2a$10$.5MYojBIqhh9TyBWpl.sKu1whW/MGEX7yFwJRmqFgesiGe4MHfDCy','estudiante','34537',NULL,NULL,'2026-04-19 19:36:16'),(58,'Giovanni','Gomez Marquina','33845@est.uni.edu','$2a$10$.5MYojBIqhh9TyBWpl.sKu1whW/MGEX7yFwJRmqFgesiGe4MHfDCy','estudiante','33845',NULL,NULL,'2026-04-19 19:36:16'),(59,'Leonard Sixto','Guarabia Jorge','35405@est.uni.edu','$2a$10$.5MYojBIqhh9TyBWpl.sKu1whW/MGEX7yFwJRmqFgesiGe4MHfDCy','estudiante','35405',NULL,NULL,'2026-04-19 19:36:16'),(60,'Shiro Moises','Guzman Hayashida','34239@est.uni.edu','$2a$10$.5MYojBIqhh9TyBWpl.sKu1whW/MGEX7yFwJRmqFgesiGe4MHfDCy','estudiante','34239',NULL,NULL,'2026-04-19 19:36:16'),(61,'Alberto','Mamani Huarachi','35101@est.uni.edu','$2a$10$.5MYojBIqhh9TyBWpl.sKu1whW/MGEX7yFwJRmqFgesiGe4MHfDCy','estudiante','35101',NULL,NULL,'2026-04-19 19:36:16'),(62,'David','Miranda Paniagua','22715@est.uni.edu','$2a$10$.5MYojBIqhh9TyBWpl.sKu1whW/MGEX7yFwJRmqFgesiGe4MHfDCy','estudiante','22715',NULL,NULL,'2026-04-19 19:36:16'),(63,'Leonel Jesus','Montaño Angulo','35809@est.uni.edu','$2a$10$.5MYojBIqhh9TyBWpl.sKu1whW/MGEX7yFwJRmqFgesiGe4MHfDCy','estudiante','35809',NULL,NULL,'2026-04-19 19:36:16'),(64,'Jheferson Angel','Montaño Torrico','35158@est.uni.edu','$2a$10$.5MYojBIqhh9TyBWpl.sKu1whW/MGEX7yFwJRmqFgesiGe4MHfDCy','estudiante','35158',NULL,NULL,'2026-04-19 19:36:16'),(65,'Jhasim Jamir','Pardo Galindo','20023@est.uni.edu','$2a$10$.5MYojBIqhh9TyBWpl.sKu1whW/MGEX7yFwJRmqFgesiGe4MHfDCy','estudiante','20023',NULL,NULL,'2026-04-19 19:36:16'),(66,'Jhoset Asli','Pinto Ugarte','35670@est.uni.edu','$2a$10$.5MYojBIqhh9TyBWpl.sKu1whW/MGEX7yFwJRmqFgesiGe4MHfDCy','estudiante','35670',NULL,NULL,'2026-04-19 19:36:16'),(67,'Arvin Alexander','Poma Roque','33765@est.uni.edu','$2a$10$.5MYojBIqhh9TyBWpl.sKu1whW/MGEX7yFwJRmqFgesiGe4MHfDCy','estudiante','33765',NULL,NULL,'2026-04-19 19:36:16'),(68,'Jhoel','Ponce Siles','35701@est.uni.edu','$2a$10$.5MYojBIqhh9TyBWpl.sKu1whW/MGEX7yFwJRmqFgesiGe4MHfDCy','estudiante','35701',NULL,NULL,'2026-04-19 19:36:16'),(69,'Paul Dussan','Quispe Viscarra','35444@est.uni.edu','$2a$10$.5MYojBIqhh9TyBWpl.sKu1whW/MGEX7yFwJRmqFgesiGe4MHfDCy','estudiante','35444',NULL,NULL,'2026-04-19 19:36:16'),(70,'Pedro Miguel','Ramirez Quiroz','35517@est.uni.edu','$2a$10$.5MYojBIqhh9TyBWpl.sKu1whW/MGEX7yFwJRmqFgesiGe4MHfDCy','estudiante','35517',NULL,NULL,'2026-04-19 19:36:16'),(71,'Elder','Vasquez Quispe','35964@est.uni.edu','$2a$10$.5MYojBIqhh9TyBWpl.sKu1whW/MGEX7yFwJRmqFgesiGe4MHfDCy','estudiante','35964',NULL,NULL,'2026-04-19 19:36:16'),(72,'Damaris Kate','Vela Arias','33795@est.uni.edu','$2a$10$.5MYojBIqhh9TyBWpl.sKu1whW/MGEX7yFwJRmqFgesiGe4MHfDCy','estudiante','33795',NULL,NULL,'2026-04-19 19:36:16'),(73,'Juan Daniel','Villazon Mamani','35967@est.uni.edu','$2a$10$.5MYojBIqhh9TyBWpl.sKu1whW/MGEX7yFwJRmqFgesiGe4MHfDCy','estudiante','35967',NULL,NULL,'2026-04-19 19:36:16'),(74,'Paola Isabel','Ortiz Diaz','ingles@unicen.edu.bo','$2a$10$vHOo4zsHFxMiwL37cv/xqeh5ztnYaqTVPzPiOiMZ.evo1iVrIRRuW','docente','8005375','70372572',NULL,'2026-04-19 20:30:49'),(75,'Dunia','Soliz','progra@unicen.edu.bo','$2a$10$RUE/k3pufLWTZ3fRpQQxwexlRiQCIBH5wX6vT7jwMDv67FMcpMvKq','docente','12345','70726817',NULL,'2026-04-19 20:32:20'),(76,'Sergio ','Balderrama Guzmán','emprendimiento@unicen.edu.bo','$2a$10$6FlGJ.pzjTepqDIpThAn5.k1HMur5ACs1AvZ8mTCsBExZJT1is4..','docente','6456053 ','72710005',NULL,'2026-04-19 20:33:24'),(77,'Irasid Carola','Nuñez Quiroga','est@unicen.edu.bo','$2a$10$mIIbuLHkN34a77Avz48VOOxXJHS2o94zSuifeKhdLMsc8Zlxc8wIa','docente','13456','71732320',NULL,'2026-04-19 20:41:46'),(78,'Rafael','Mejia','analisis@unicen.edu.bo','$2a$10$lvllHMdxvCf.KqCA/.FjHOW/UiEqJAk8VmKW2Slu6bQWIpbJsNt1a','docente','123456','71431922',NULL,'2026-04-19 20:43:04');
/*!40000 ALTER TABLE `usuarios` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-04-21 15:07:02
