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
  `respaldo_url` varchar(500) DEFAULT NULL,
  `editado_por` int(11) DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_asistencia` (`estudiante_id`,`materia_id`,`fecha`),
  KEY `materia_id` (`materia_id`),
  CONSTRAINT `asistencias_ibfk_1` FOREIGN KEY (`estudiante_id`) REFERENCES `estudiantes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `asistencias_ibfk_2` FOREIGN KEY (`materia_id`) REFERENCES `materias` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=272 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `asistencias`
--

LOCK TABLES `asistencias` WRITE;
/*!40000 ALTER TABLE `asistencias` DISABLE KEYS */;
INSERT INTO `asistencias` VALUES (8,35,16,'2026-04-19','falta',NULL,'2026-04-19 19:48:05',NULL,NULL,NULL),(9,36,16,'2026-04-19','presente',NULL,'2026-04-19 19:48:05',NULL,NULL,NULL),(10,37,16,'2026-04-19','presente',NULL,'2026-04-19 19:48:05',NULL,NULL,NULL),(11,38,16,'2026-04-19','tarde',NULL,'2026-04-19 19:48:05',NULL,NULL,NULL),(12,39,16,'2026-04-19','permiso',NULL,'2026-04-19 19:48:05',NULL,NULL,NULL),(13,40,16,'2026-04-19','permiso',NULL,'2026-04-19 19:48:05',NULL,NULL,NULL),(14,41,16,'2026-04-19','permiso',NULL,'2026-04-19 19:48:05',NULL,NULL,NULL),(15,42,16,'2026-04-19','presente',NULL,'2026-04-19 19:48:05',NULL,NULL,NULL),(16,43,16,'2026-04-19','presente',NULL,'2026-04-19 19:48:05',NULL,NULL,NULL),(17,44,16,'2026-04-19','presente',NULL,'2026-04-19 19:48:05',NULL,NULL,NULL),(18,45,16,'2026-04-19','presente',NULL,'2026-04-19 19:48:05',NULL,NULL,NULL),(19,46,16,'2026-04-19','presente',NULL,'2026-04-19 19:48:05',NULL,NULL,NULL),(20,47,16,'2026-04-19','presente',NULL,'2026-04-19 19:48:05',NULL,NULL,NULL),(21,48,16,'2026-04-19','presente',NULL,'2026-04-19 19:48:05',NULL,NULL,NULL),(22,49,16,'2026-04-19','presente',NULL,'2026-04-19 19:48:05',NULL,NULL,NULL),(23,50,16,'2026-04-19','presente',NULL,'2026-04-19 19:48:05',NULL,NULL,NULL),(24,51,16,'2026-04-19','presente',NULL,'2026-04-19 19:48:05',NULL,NULL,NULL),(25,52,16,'2026-04-19','presente',NULL,'2026-04-19 19:48:05',NULL,NULL,NULL),(26,53,16,'2026-04-19','presente',NULL,'2026-04-19 19:48:05',NULL,NULL,NULL),(27,54,16,'2026-04-19','presente',NULL,'2026-04-19 19:48:05',NULL,NULL,NULL),(28,55,16,'2026-04-19','presente',NULL,'2026-04-19 19:48:05',NULL,NULL,NULL),(29,56,16,'2026-04-19','presente',NULL,'2026-04-19 19:48:05',NULL,NULL,NULL),(30,57,16,'2026-04-19','presente',NULL,'2026-04-19 19:48:05',NULL,NULL,NULL),(31,58,16,'2026-04-19','presente',NULL,'2026-04-19 19:48:05',NULL,NULL,NULL),(32,59,16,'2026-04-19','presente',NULL,'2026-04-19 19:48:05',NULL,NULL,NULL),(33,60,16,'2026-04-19','presente',NULL,'2026-04-19 19:48:05',NULL,NULL,NULL),(34,61,16,'2026-04-19','presente',NULL,'2026-04-19 19:48:05',NULL,NULL,NULL),(35,62,16,'2026-04-19','presente',NULL,'2026-04-19 19:48:05',NULL,NULL,NULL),(36,63,16,'2026-04-19','presente',NULL,'2026-04-19 19:48:05',NULL,NULL,NULL),(37,64,16,'2026-04-19','presente',NULL,'2026-04-19 19:48:05',NULL,NULL,NULL),(38,65,16,'2026-04-19','presente',NULL,'2026-04-19 19:48:05',NULL,NULL,NULL),(39,66,16,'2026-04-19','presente',NULL,'2026-04-19 19:48:05',NULL,NULL,NULL),(40,67,16,'2026-04-19','presente',NULL,'2026-04-19 19:48:05',NULL,NULL,NULL),(141,4,15,'2026-04-19','presente',NULL,'2026-04-19 19:52:43',NULL,NULL,NULL),(142,35,16,'2026-04-21','presente',NULL,'2026-04-21 12:02:31',NULL,NULL,NULL),(143,36,16,'2026-04-21','presente',NULL,'2026-04-21 12:02:31',NULL,NULL,NULL),(144,37,16,'2026-04-21','falta',NULL,'2026-04-21 12:02:31',NULL,NULL,NULL),(145,38,16,'2026-04-21','presente',NULL,'2026-04-21 12:02:31',NULL,NULL,NULL),(146,39,16,'2026-04-21','presente',NULL,'2026-04-21 12:02:31',NULL,NULL,NULL),(147,40,16,'2026-04-21','falta',NULL,'2026-04-21 12:02:31',NULL,NULL,NULL),(148,41,16,'2026-04-21','presente',NULL,'2026-04-21 12:02:31',NULL,NULL,NULL),(149,42,16,'2026-04-21','presente',NULL,'2026-04-21 12:02:31',NULL,NULL,NULL),(150,43,16,'2026-04-21','tarde','Tarde a clases','2026-04-21 12:02:31',NULL,8,'2026-04-21 15:49:17'),(151,44,16,'2026-04-21','falta',NULL,'2026-04-21 12:02:31',NULL,NULL,NULL),(152,45,16,'2026-04-21','presente',NULL,'2026-04-21 12:02:31',NULL,NULL,NULL),(153,46,16,'2026-04-21','presente',NULL,'2026-04-21 12:02:31',NULL,NULL,NULL),(154,47,16,'2026-04-21','presente',NULL,'2026-04-21 12:02:31',NULL,NULL,NULL),(155,48,16,'2026-04-21','falta',NULL,'2026-04-21 12:02:31',NULL,NULL,NULL),(156,49,16,'2026-04-21','presente',NULL,'2026-04-21 12:02:31',NULL,NULL,NULL),(157,50,16,'2026-04-21','presente',NULL,'2026-04-21 12:02:31',NULL,NULL,NULL),(158,51,16,'2026-04-21','falta',NULL,'2026-04-21 12:02:31',NULL,NULL,NULL),(159,52,16,'2026-04-21','falta',NULL,'2026-04-21 12:02:31',NULL,NULL,NULL),(160,53,16,'2026-04-21','presente',NULL,'2026-04-21 12:02:31',NULL,NULL,NULL),(161,54,16,'2026-04-21','presente',NULL,'2026-04-21 12:02:31',NULL,NULL,NULL),(162,55,16,'2026-04-21','falta',NULL,'2026-04-21 12:02:31',NULL,NULL,NULL),(163,56,16,'2026-04-21','falta',NULL,'2026-04-21 12:02:31',NULL,NULL,NULL),(164,57,16,'2026-04-21','presente',NULL,'2026-04-21 12:02:31',NULL,NULL,NULL),(165,58,16,'2026-04-21','presente',NULL,'2026-04-21 12:02:31',NULL,NULL,NULL),(166,59,16,'2026-04-21','presente',NULL,'2026-04-21 12:02:31',NULL,NULL,NULL),(167,60,16,'2026-04-21','presente',NULL,'2026-04-21 12:02:31',NULL,NULL,NULL),(168,61,16,'2026-04-21','falta',NULL,'2026-04-21 12:02:31',NULL,NULL,NULL),(169,62,16,'2026-04-21','presente',NULL,'2026-04-21 12:02:31',NULL,NULL,NULL),(170,63,16,'2026-04-21','falta',NULL,'2026-04-21 12:02:31',NULL,NULL,NULL),(171,64,16,'2026-04-21','presente',NULL,'2026-04-21 12:02:31',NULL,NULL,NULL),(172,65,16,'2026-04-21','falta',NULL,'2026-04-21 12:02:31',NULL,NULL,NULL),(173,66,16,'2026-04-21','presente',NULL,'2026-04-21 12:02:31',NULL,NULL,NULL),(174,67,16,'2026-04-21','presente',NULL,'2026-04-21 12:02:31',NULL,NULL,NULL),(176,4,15,'2026-04-21','presente',NULL,'2026-04-21 13:35:22',NULL,NULL,NULL),(177,5,15,'2026-04-21','presente',NULL,'2026-04-21 13:35:22',NULL,NULL,NULL),(178,6,15,'2026-04-21','presente',NULL,'2026-04-21 13:35:22',NULL,NULL,NULL),(179,7,15,'2026-04-21','presente',NULL,'2026-04-21 13:35:22',NULL,NULL,NULL),(180,8,15,'2026-04-21','presente',NULL,'2026-04-21 13:35:22',NULL,NULL,NULL),(181,9,15,'2026-04-21','presente',NULL,'2026-04-21 13:35:22',NULL,NULL,NULL),(182,10,15,'2026-04-21','presente',NULL,'2026-04-21 13:35:22',NULL,NULL,NULL),(183,11,15,'2026-04-21','presente',NULL,'2026-04-21 13:35:22',NULL,NULL,NULL),(184,12,15,'2026-04-21','presente',NULL,'2026-04-21 13:35:22',NULL,NULL,NULL),(185,13,15,'2026-04-21','presente',NULL,'2026-04-21 13:35:22',NULL,NULL,NULL),(186,14,15,'2026-04-21','falta',NULL,'2026-04-21 13:35:22',NULL,NULL,NULL),(187,15,15,'2026-04-21','presente',NULL,'2026-04-21 13:35:22',NULL,NULL,NULL),(188,16,15,'2026-04-21','falta',NULL,'2026-04-21 13:35:22',NULL,NULL,NULL),(189,17,15,'2026-04-21','presente',NULL,'2026-04-21 13:35:22',NULL,NULL,NULL),(190,18,15,'2026-04-21','presente',NULL,'2026-04-21 13:35:22',NULL,NULL,NULL),(191,19,15,'2026-04-21','presente',NULL,'2026-04-21 13:35:22',NULL,NULL,NULL),(192,20,15,'2026-04-21','falta',NULL,'2026-04-21 13:35:22',NULL,NULL,NULL),(193,21,15,'2026-04-21','presente',NULL,'2026-04-21 13:35:22',NULL,NULL,NULL),(194,22,15,'2026-04-21','presente',NULL,'2026-04-21 13:35:22',NULL,NULL,NULL),(195,23,15,'2026-04-21','presente',NULL,'2026-04-21 13:35:22',NULL,NULL,NULL),(196,24,15,'2026-04-21','falta',NULL,'2026-04-21 13:35:22',NULL,NULL,NULL),(197,25,15,'2026-04-21','presente',NULL,'2026-04-21 13:35:22',NULL,NULL,NULL),(198,26,15,'2026-04-21','presente',NULL,'2026-04-21 13:35:22',NULL,NULL,NULL),(199,27,15,'2026-04-21','falta',NULL,'2026-04-21 13:35:22',NULL,NULL,NULL),(200,28,15,'2026-04-21','presente',NULL,'2026-04-21 13:35:22',NULL,NULL,NULL),(201,29,15,'2026-04-21','presente',NULL,'2026-04-21 13:35:22',NULL,NULL,NULL),(202,30,15,'2026-04-21','falta',NULL,'2026-04-21 13:35:22',NULL,NULL,NULL),(203,31,15,'2026-04-21','falta',NULL,'2026-04-21 13:35:22',NULL,NULL,NULL),(204,32,15,'2026-04-21','presente',NULL,'2026-04-21 13:35:22',NULL,NULL,NULL),(205,33,15,'2026-04-21','presente',NULL,'2026-04-21 13:35:22',NULL,NULL,NULL),(206,34,15,'2026-04-21','presente',NULL,'2026-04-21 13:35:22',NULL,NULL,NULL),(239,35,16,'2026-04-22','presente',NULL,'2026-04-22 16:07:02',NULL,NULL,NULL),(240,36,16,'2026-04-22','presente',NULL,'2026-04-22 16:07:02',NULL,NULL,NULL),(241,37,16,'2026-04-22','falta',NULL,'2026-04-22 16:07:02',NULL,NULL,NULL),(242,38,16,'2026-04-22','presente',NULL,'2026-04-22 16:07:02',NULL,NULL,NULL),(243,39,16,'2026-04-22','presente',NULL,'2026-04-22 16:07:02',NULL,NULL,NULL),(244,40,16,'2026-04-22','falta',NULL,'2026-04-22 16:07:02',NULL,NULL,NULL),(245,41,16,'2026-04-22','presente',NULL,'2026-04-22 16:07:02',NULL,NULL,NULL),(246,42,16,'2026-04-22','presente',NULL,'2026-04-22 16:07:02',NULL,NULL,NULL),(247,43,16,'2026-04-22','presente',NULL,'2026-04-22 16:07:02',NULL,NULL,NULL),(248,44,16,'2026-04-22','falta',NULL,'2026-04-22 16:07:02',NULL,NULL,NULL),(249,45,16,'2026-04-22','presente',NULL,'2026-04-22 16:07:02',NULL,NULL,NULL),(250,46,16,'2026-04-22','presente',NULL,'2026-04-22 16:07:02',NULL,NULL,NULL),(251,47,16,'2026-04-22','permiso','2','2026-04-22 16:07:02',NULL,NULL,NULL),(252,48,16,'2026-04-22','presente',NULL,'2026-04-22 16:07:02',NULL,NULL,NULL),(253,49,16,'2026-04-22','presente',NULL,'2026-04-22 16:07:02',NULL,NULL,NULL),(254,50,16,'2026-04-22','presente',NULL,'2026-04-22 16:07:02',NULL,NULL,NULL),(255,51,16,'2026-04-22','presente',NULL,'2026-04-22 16:07:02',NULL,NULL,NULL),(256,52,16,'2026-04-22','falta',NULL,'2026-04-22 16:07:02',NULL,NULL,NULL),(257,53,16,'2026-04-22','presente',NULL,'2026-04-22 16:07:02',NULL,NULL,NULL),(258,54,16,'2026-04-22','presente',NULL,'2026-04-22 16:07:02',NULL,NULL,NULL),(259,55,16,'2026-04-22','presente',NULL,'2026-04-22 16:07:02',NULL,NULL,NULL),(260,56,16,'2026-04-22','falta',NULL,'2026-04-22 16:07:02',NULL,NULL,NULL),(261,57,16,'2026-04-22','presente',NULL,'2026-04-22 16:07:02',NULL,NULL,NULL),(262,58,16,'2026-04-22','presente',NULL,'2026-04-22 16:07:02',NULL,NULL,NULL),(263,59,16,'2026-04-22','presente',NULL,'2026-04-22 16:07:02',NULL,NULL,NULL),(264,60,16,'2026-04-22','presente',NULL,'2026-04-22 16:07:02',NULL,NULL,NULL),(265,61,16,'2026-04-22','presente',NULL,'2026-04-22 16:07:02',NULL,NULL,NULL),(266,62,16,'2026-04-22','presente',NULL,'2026-04-22 16:07:02',NULL,NULL,NULL),(267,63,16,'2026-04-22','presente',NULL,'2026-04-22 16:07:02',NULL,NULL,NULL),(268,64,16,'2026-04-22','presente',NULL,'2026-04-22 16:07:02',NULL,NULL,NULL),(269,65,16,'2026-04-22','falta',NULL,'2026-04-22 16:07:02',NULL,NULL,NULL),(270,66,16,'2026-04-22','presente',NULL,'2026-04-22 16:07:02',NULL,NULL,NULL),(271,67,16,'2026-04-22','presente',NULL,'2026-04-22 16:07:02',NULL,NULL,NULL);
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
INSERT INTO `cursos_capacitacion` VALUES (2,2,'Docker y Kubernetes','Udemy','2026-02-01','2026-03-15',60,NULL,NULL,'pendiente','2026-04-19 15:27:38'),(4,2,'Docker y Kubernetes','Udemy','2026-02-01','2026-03-15',60,NULL,NULL,'pendiente','2026-04-19 15:27:38');
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
INSERT INTO `disciplina_estudiantes` VALUES (2,'permiso',3,NULL,'2026-04-15','Cita médica presentada con justificativo',2,'2026-04-19 15:27:38'),(3,'falta',27,NULL,'2026-04-18','Hostigamiento',8,'2026-04-19 20:45:14');
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
INSERT INTO `docentes` VALUES (3,9,'Desarrollo de Software','Dr.h.c. Ing'),(4,74,'Idiomas','Lic'),(5,75,'Programacion','Lic'),(6,76,'Emprendimiento','Mgr'),(7,77,'Estructuras','Lic'),(8,78,'Analisis de Datos','Lic');
/*!40000 ALTER TABLE `docentes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `entregas_tareas`
--

DROP TABLE IF EXISTS `entregas_tareas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `entregas_tareas` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tarea_id` int(11) NOT NULL,
  `estudiante_id` int(11) NOT NULL,
  `archivo_nombre` varchar(300) NOT NULL,
  `archivo_path` varchar(500) NOT NULL,
  `fecha_entrega` datetime DEFAULT current_timestamp(),
  `calificacion` decimal(4,2) DEFAULT NULL,
  `comentario_calificacion` text DEFAULT NULL,
  `fecha_calificacion` datetime DEFAULT NULL,
  `visto_por_docente` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_entrega` (`tarea_id`,`estudiante_id`),
  KEY `estudiante_id` (`estudiante_id`),
  CONSTRAINT `entregas_tareas_ibfk_1` FOREIGN KEY (`tarea_id`) REFERENCES `tareas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `entregas_tareas_ibfk_2` FOREIGN KEY (`estudiante_id`) REFERENCES `estudiantes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `entregas_tareas`
--

LOCK TABLES `entregas_tareas` WRITE;
/*!40000 ALTER TABLE `entregas_tareas` DISABLE KEYS */;
/*!40000 ALTER TABLE `entregas_tareas` ENABLE KEYS */;
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
INSERT INTO `estudiantes` VALUES (2,6,1,5,'EST-2023-002','2023-02-01'),(3,7,1,3,'EST-2024-003','2024-02-01'),(4,10,2,1,'34008','2026-04-19'),(5,11,2,1,'33946','2026-04-19'),(6,12,2,1,'33858','2026-04-19'),(7,13,2,1,'31713','2026-04-19'),(8,14,2,1,'34237','2026-04-19'),(9,15,2,1,'34428','2026-04-19'),(10,16,2,1,'34261','2026-04-19'),(11,17,2,1,'33903','2026-04-19'),(12,18,2,1,'34240','2026-04-19'),(13,19,2,1,'35094','2026-04-19'),(14,20,2,1,'34105','2026-04-19'),(15,21,2,1,'34823','2026-04-19'),(16,22,2,1,'34325','2026-04-19'),(17,23,2,1,'35672','2026-04-19'),(18,24,2,1,'33769','2026-04-19'),(19,25,2,1,'34076','2026-04-19'),(20,26,2,1,'26807','2026-04-19'),(21,27,2,1,'35632','2026-04-19'),(22,28,2,1,'34561','2026-04-19'),(23,29,2,1,'33844','2026-04-19'),(24,30,2,1,'22718','2026-04-19'),(25,31,2,1,'34857','2026-04-19'),(26,32,2,1,'33972','2026-04-19'),(27,33,2,1,'21195','2026-04-19'),(28,34,2,1,'35573','2026-04-19'),(29,35,2,1,'33948','2026-04-19'),(30,36,2,1,'35866','2026-04-19'),(31,37,2,1,'33790','2026-04-19'),(32,38,2,1,'33770','2026-04-19'),(33,39,2,1,'33900','2026-04-19'),(34,40,2,1,'35018','2026-04-19'),(35,41,2,1,'34067','2026-04-26'),(36,42,2,1,'33871','2026-04-26'),(37,43,2,1,'36001','2026-04-26'),(38,44,2,1,'33924','2026-04-26'),(39,45,2,1,'36023','2026-04-26'),(40,46,2,1,'35750','2026-04-26'),(41,47,2,1,'33860','2026-04-26'),(42,48,2,1,'35635','2026-04-26'),(43,49,2,1,'33816','2026-04-26'),(44,50,2,1,'36055','2026-04-26'),(45,51,2,1,'35588','2026-04-26'),(46,52,2,1,'33854','2026-04-26'),(47,53,2,1,'34111','2026-04-26'),(48,54,2,1,'35910','2026-04-26'),(49,55,2,1,'35000','2026-04-26'),(50,56,2,1,'34932','2026-04-26'),(51,57,2,1,'34537','2026-04-26'),(52,58,2,1,'33845','2026-04-26'),(53,59,2,1,'35405','2026-04-26'),(54,60,2,1,'34239','2026-04-26'),(55,61,2,1,'35101','2026-04-26'),(56,62,2,1,'22715','2026-04-26'),(57,63,2,1,'35809','2026-04-26'),(58,64,2,1,'35158','2026-04-26'),(59,65,2,1,'20023','2026-04-26'),(60,66,2,1,'35670','2026-04-26'),(61,67,2,1,'33765','2026-04-26'),(62,68,2,1,'35701','2026-04-26'),(63,69,2,1,'35444','2026-04-26'),(64,70,2,1,'35517','2026-04-26'),(65,71,2,1,'35964','2026-04-26'),(66,72,2,1,'33795','2026-04-26'),(67,73,2,1,'35967','2026-04-26');
/*!40000 ALTER TABLE `estudiantes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `grade_report_details`
--

DROP TABLE IF EXISTS `grade_report_details`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `grade_report_details` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `acta_id` int(11) NOT NULL,
  `estudiante_id` int(11) NOT NULL,
  `nota_final` decimal(5,2) NOT NULL DEFAULT 0.00,
  `estado` enum('aprobado','reprobado') NOT NULL,
  `modalidad` enum('regular','segunda_instancia','examen_mesa','examen_gracia') NOT NULL DEFAULT 'regular',
  `primer_parcial` decimal(5,2) DEFAULT NULL,
  `segundo_parcial` decimal(5,2) DEFAULT NULL,
  `examen_final` decimal(5,2) DEFAULT NULL,
  `examen_recuperacion` decimal(5,2) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_grade_report_student` (`acta_id`,`estudiante_id`),
  KEY `estudiante_id` (`estudiante_id`),
  CONSTRAINT `grade_report_details_ibfk_1` FOREIGN KEY (`acta_id`) REFERENCES `grade_reports` (`id`) ON DELETE CASCADE,
  CONSTRAINT `grade_report_details_ibfk_2` FOREIGN KEY (`estudiante_id`) REFERENCES `estudiantes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=418 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `grade_report_details`
--

LOCK TABLES `grade_report_details` WRITE;
/*!40000 ALTER TABLE `grade_report_details` DISABLE KEYS */;
INSERT INTO `grade_report_details` VALUES (1,1,4,18.00,'reprobado','regular',18.00,0.00,0.00,NULL),(2,1,5,33.00,'reprobado','regular',33.00,0.00,0.00,NULL),(3,1,6,21.00,'reprobado','regular',21.00,0.00,0.00,NULL),(4,1,7,24.00,'reprobado','regular',24.00,0.00,0.00,NULL),(5,1,8,19.00,'reprobado','regular',19.00,0.00,0.00,NULL),(6,1,9,32.00,'reprobado','regular',32.00,0.00,0.00,NULL),(7,1,10,27.00,'reprobado','regular',27.00,0.00,0.00,NULL),(8,1,11,25.00,'reprobado','regular',25.00,0.00,0.00,NULL),(9,1,12,14.00,'reprobado','regular',14.00,0.00,0.00,NULL),(10,1,13,29.00,'reprobado','regular',29.00,0.00,0.00,NULL),(11,1,14,32.00,'reprobado','regular',32.00,0.00,0.00,NULL),(12,1,15,18.00,'reprobado','regular',18.00,0.00,0.00,NULL),(13,1,16,0.00,'reprobado','regular',0.00,0.00,0.00,NULL),(14,1,17,16.00,'reprobado','regular',16.00,0.00,0.00,NULL),(15,1,18,22.00,'reprobado','regular',22.00,0.00,0.00,NULL),(16,1,19,29.00,'reprobado','regular',29.00,0.00,0.00,NULL),(17,1,20,0.00,'reprobado','regular',0.00,0.00,0.00,NULL),(18,1,21,15.00,'reprobado','regular',15.00,0.00,0.00,NULL),(19,1,22,19.00,'reprobado','regular',19.00,0.00,0.00,NULL),(20,1,23,16.00,'reprobado','regular',16.00,0.00,0.00,NULL),(21,1,24,27.00,'reprobado','regular',27.00,0.00,0.00,NULL),(22,1,25,21.00,'reprobado','regular',21.00,0.00,0.00,NULL),(23,1,26,31.00,'reprobado','regular',31.00,0.00,0.00,NULL),(24,1,27,1.00,'reprobado','regular',1.00,0.00,0.00,NULL),(25,1,28,27.00,'reprobado','regular',27.00,0.00,0.00,NULL),(26,1,29,26.00,'reprobado','regular',26.00,0.00,0.00,NULL),(27,1,30,21.00,'reprobado','regular',21.00,0.00,0.00,NULL),(28,1,31,21.98,'reprobado','regular',21.98,0.00,0.00,NULL),(29,1,32,31.00,'reprobado','regular',31.00,0.00,0.00,NULL),(30,1,33,23.00,'reprobado','regular',23.00,0.00,0.00,NULL),(31,1,34,30.00,'reprobado','regular',30.00,0.00,0.00,NULL),(65,2,36,26.00,'reprobado','regular',26.00,0.00,0.00,NULL),(66,2,37,0.00,'reprobado','regular',0.00,0.00,0.00,NULL),(67,2,38,19.00,'reprobado','regular',19.00,0.00,0.00,NULL),(68,2,39,25.00,'reprobado','regular',25.00,0.00,0.00,NULL),(69,2,40,0.00,'reprobado','regular',0.00,0.00,0.00,NULL),(70,2,41,30.00,'reprobado','regular',30.00,0.00,0.00,NULL),(71,2,42,21.00,'reprobado','regular',21.00,0.00,0.00,NULL),(72,2,43,34.00,'reprobado','regular',34.00,0.00,0.00,NULL),(73,2,44,0.00,'reprobado','regular',0.00,0.00,0.00,NULL),(74,2,45,26.00,'reprobado','regular',26.00,0.00,0.00,NULL),(75,2,46,20.00,'reprobado','regular',20.00,0.00,0.00,NULL),(76,2,47,25.00,'reprobado','regular',25.00,0.00,0.00,NULL),(77,2,49,24.00,'reprobado','regular',24.00,0.00,0.00,NULL),(78,2,48,33.00,'reprobado','regular',33.00,0.00,0.00,NULL),(79,2,50,30.00,'reprobado','regular',30.00,0.00,0.00,NULL),(80,2,51,24.00,'reprobado','regular',24.00,0.00,0.00,NULL),(81,2,52,0.00,'reprobado','regular',0.00,0.00,0.00,NULL),(82,2,53,29.00,'reprobado','regular',29.00,0.00,0.00,NULL),(83,2,54,14.00,'reprobado','regular',14.00,0.00,0.00,NULL),(84,2,35,26.00,'reprobado','regular',26.00,0.00,0.00,NULL),(85,2,55,21.00,'reprobado','regular',21.00,0.00,0.00,NULL),(86,2,56,0.00,'reprobado','regular',0.00,0.00,0.00,NULL),(87,2,57,18.00,'reprobado','regular',18.00,0.00,0.00,NULL),(88,2,58,30.00,'reprobado','regular',30.00,0.00,0.00,NULL),(89,2,59,32.00,'reprobado','regular',32.00,0.00,0.00,NULL),(90,2,60,20.00,'reprobado','regular',20.00,0.00,0.00,NULL),(91,2,61,26.00,'reprobado','regular',26.00,0.00,0.00,NULL),(92,2,62,27.00,'reprobado','regular',27.00,0.00,0.00,NULL),(93,2,63,18.00,'reprobado','regular',18.00,0.00,0.00,NULL),(94,2,64,29.00,'reprobado','regular',29.00,0.00,0.00,NULL),(95,2,65,0.00,'reprobado','regular',0.00,0.00,0.00,NULL),(96,2,66,21.99,'reprobado','regular',21.99,0.00,0.00,NULL),(97,2,67,34.00,'reprobado','regular',34.00,0.00,0.00,NULL),(98,3,4,8.00,'reprobado','regular',8.00,0.00,0.00,NULL),(99,3,5,20.00,'reprobado','regular',20.00,0.00,0.00,NULL),(100,3,6,28.00,'reprobado','regular',28.00,0.00,0.00,NULL),(101,3,7,15.00,'reprobado','regular',15.00,0.00,0.00,NULL),(102,3,8,19.00,'reprobado','regular',19.00,0.00,0.00,NULL),(103,3,9,16.00,'reprobado','regular',16.00,0.00,0.00,NULL),(104,3,10,24.00,'reprobado','regular',24.00,0.00,0.00,NULL),(105,3,11,35.00,'reprobado','regular',35.00,0.00,0.00,NULL),(106,3,12,7.00,'reprobado','regular',7.00,0.00,0.00,NULL),(107,3,13,33.00,'reprobado','regular',33.00,0.00,0.00,NULL),(108,3,14,5.00,'reprobado','regular',5.00,0.00,0.00,NULL),(109,3,15,28.00,'reprobado','regular',28.00,0.00,0.00,NULL),(110,3,16,0.00,'reprobado','regular',0.00,0.00,0.00,NULL),(111,3,17,8.00,'reprobado','regular',8.00,0.00,0.00,NULL),(112,3,18,35.00,'reprobado','regular',35.00,0.00,0.00,NULL),(113,3,19,31.00,'reprobado','regular',31.00,0.00,0.00,NULL),(114,3,20,0.00,'reprobado','regular',0.00,0.00,0.00,NULL),(115,3,21,16.00,'reprobado','regular',16.00,0.00,0.00,NULL),(116,3,22,35.00,'reprobado','regular',35.00,0.00,0.00,NULL),(117,3,23,14.00,'reprobado','regular',14.00,0.00,0.00,NULL),(118,3,24,19.00,'reprobado','regular',19.00,0.00,0.00,NULL),(119,3,25,31.00,'reprobado','regular',31.00,0.00,0.00,NULL),(120,3,26,35.00,'reprobado','regular',35.00,0.00,0.00,NULL),(121,3,27,1.00,'reprobado','regular',1.00,0.00,0.00,NULL),(122,3,28,31.00,'reprobado','regular',31.00,0.00,0.00,NULL),(123,3,29,12.00,'reprobado','regular',12.00,0.00,0.00,NULL),(124,3,30,5.00,'reprobado','regular',5.00,0.00,0.00,NULL),(125,3,31,26.00,'reprobado','regular',26.00,0.00,0.00,NULL),(126,3,32,29.00,'reprobado','regular',29.00,0.00,0.00,NULL),(127,3,33,33.00,'reprobado','regular',33.00,0.00,0.00,NULL),(128,3,34,35.00,'reprobado','regular',35.00,0.00,0.00,NULL),(129,4,36,11.00,'reprobado','regular',11.00,0.00,0.00,NULL),(130,4,37,0.00,'reprobado','regular',0.00,0.00,0.00,NULL),(131,4,38,16.00,'reprobado','regular',16.00,0.00,0.00,NULL),(132,4,39,28.00,'reprobado','regular',28.00,0.00,0.00,NULL),(133,4,40,0.00,'reprobado','regular',0.00,0.00,0.00,NULL),(134,4,41,25.00,'reprobado','regular',25.00,0.00,0.00,NULL),(135,4,42,31.00,'reprobado','regular',31.00,0.00,0.00,NULL),(136,4,43,31.00,'reprobado','regular',31.00,0.00,0.00,NULL),(137,4,44,0.00,'reprobado','regular',0.00,0.00,0.00,NULL),(138,4,45,33.00,'reprobado','regular',33.00,0.00,0.00,NULL),(139,4,46,7.00,'reprobado','regular',7.00,0.00,0.00,NULL),(140,4,47,35.00,'reprobado','regular',35.00,0.00,0.00,NULL),(141,4,49,23.00,'reprobado','regular',23.00,0.00,0.00,NULL),(142,4,48,28.00,'reprobado','regular',28.00,0.00,0.00,NULL),(143,4,50,35.00,'reprobado','regular',35.00,0.00,0.00,NULL),(144,4,51,2.00,'reprobado','regular',2.00,0.00,0.00,NULL),(145,4,52,0.00,'reprobado','regular',0.00,0.00,0.00,NULL),(146,4,53,18.00,'reprobado','regular',18.00,0.00,0.00,NULL),(147,4,54,12.00,'reprobado','regular',12.00,0.00,0.00,NULL),(148,4,35,14.00,'reprobado','regular',14.00,0.00,0.00,NULL),(149,4,55,8.00,'reprobado','regular',8.00,0.00,0.00,NULL),(150,4,56,0.00,'reprobado','regular',0.00,0.00,0.00,NULL),(151,4,57,35.00,'reprobado','regular',35.00,0.00,0.00,NULL),(152,4,58,27.00,'reprobado','regular',27.00,0.00,0.00,NULL),(153,4,59,28.00,'reprobado','regular',28.00,0.00,0.00,NULL),(154,4,60,15.00,'reprobado','regular',15.00,0.00,0.00,NULL),(155,4,61,30.00,'reprobado','regular',30.00,0.00,0.00,NULL),(156,4,62,29.00,'reprobado','regular',29.00,0.00,0.00,NULL),(157,4,63,23.00,'reprobado','regular',23.00,0.00,0.00,NULL),(158,4,64,28.00,'reprobado','regular',28.00,0.00,0.00,NULL),(159,4,65,0.00,'reprobado','regular',0.00,0.00,0.00,NULL),(160,4,66,20.00,'reprobado','regular',20.00,0.00,0.00,NULL),(161,4,67,31.00,'reprobado','regular',31.00,0.00,0.00,NULL),(162,5,36,18.00,'reprobado','regular',18.00,0.00,0.00,NULL),(163,5,37,0.00,'reprobado','regular',0.00,0.00,0.00,NULL),(164,5,38,23.00,'reprobado','regular',23.00,0.00,0.00,NULL),(165,5,39,33.00,'reprobado','regular',33.00,0.00,0.00,NULL),(166,5,40,0.00,'reprobado','regular',0.00,0.00,0.00,NULL),(167,5,41,31.00,'reprobado','regular',31.00,0.00,0.00,NULL),(168,5,42,23.00,'reprobado','regular',23.00,0.00,0.00,NULL),(169,5,43,29.00,'reprobado','regular',29.00,0.00,0.00,NULL),(170,5,44,18.00,'reprobado','regular',18.00,0.00,0.00,NULL),(171,5,45,30.00,'reprobado','regular',30.00,0.00,0.00,NULL),(172,5,46,29.00,'reprobado','regular',29.00,0.00,0.00,NULL),(173,5,47,28.00,'reprobado','regular',28.00,0.00,0.00,NULL),(174,5,49,22.00,'reprobado','regular',22.00,0.00,0.00,NULL),(175,5,48,30.00,'reprobado','regular',30.00,0.00,0.00,NULL),(176,5,50,30.00,'reprobado','regular',30.00,0.00,0.00,NULL),(177,5,51,20.00,'reprobado','regular',20.00,0.00,0.00,NULL),(178,5,52,0.00,'reprobado','regular',0.00,0.00,0.00,NULL),(179,5,53,20.00,'reprobado','regular',20.00,0.00,0.00,NULL),(180,5,54,23.00,'reprobado','regular',23.00,0.00,0.00,NULL),(181,5,35,32.00,'reprobado','regular',32.00,0.00,0.00,NULL),(182,5,55,31.00,'reprobado','regular',31.00,0.00,0.00,NULL),(183,5,56,0.00,'reprobado','regular',0.00,0.00,0.00,NULL),(184,5,57,34.00,'reprobado','regular',34.00,0.00,0.00,NULL),(185,5,58,32.00,'reprobado','regular',32.00,0.00,0.00,NULL),(186,5,59,33.00,'reprobado','regular',33.00,0.00,0.00,NULL),(187,5,60,26.00,'reprobado','regular',26.00,0.00,0.00,NULL),(188,5,61,34.00,'reprobado','regular',34.00,0.00,0.00,NULL),(189,5,62,29.00,'reprobado','regular',29.00,0.00,0.00,NULL),(190,5,63,32.00,'reprobado','regular',32.00,0.00,0.00,NULL),(191,5,64,28.00,'reprobado','regular',28.00,0.00,0.00,NULL),(192,5,65,0.00,'reprobado','regular',0.00,0.00,0.00,NULL),(193,5,66,26.00,'reprobado','regular',26.00,0.00,0.00,NULL),(194,5,67,32.00,'reprobado','regular',32.00,0.00,0.00,NULL),(195,6,4,20.00,'reprobado','regular',20.00,0.00,0.00,NULL),(196,6,5,31.00,'reprobado','regular',31.00,0.00,0.00,NULL),(197,6,6,26.00,'reprobado','regular',26.00,0.00,0.00,NULL),(198,6,7,25.00,'reprobado','regular',25.00,0.00,0.00,NULL),(199,6,8,21.00,'reprobado','regular',21.00,0.00,0.00,NULL),(200,6,9,34.00,'reprobado','regular',34.00,0.00,0.00,NULL),(201,6,10,20.00,'reprobado','regular',20.00,0.00,0.00,NULL),(202,6,11,32.00,'reprobado','regular',32.00,0.00,0.00,NULL),(203,6,12,18.00,'reprobado','regular',18.00,0.00,0.00,NULL),(204,6,13,22.00,'reprobado','regular',22.00,0.00,0.00,NULL),(205,6,14,20.00,'reprobado','regular',20.00,0.00,0.00,NULL),(206,6,15,28.00,'reprobado','regular',28.00,0.00,0.00,NULL),(207,6,16,0.00,'reprobado','regular',0.00,0.00,0.00,NULL),(208,6,17,25.00,'reprobado','regular',25.00,0.00,0.00,NULL),(209,6,18,22.00,'reprobado','regular',22.00,0.00,0.00,NULL),(210,6,19,24.00,'reprobado','regular',24.00,0.00,0.00,NULL),(211,6,20,0.00,'reprobado','regular',0.00,0.00,0.00,NULL),(212,6,21,32.00,'reprobado','regular',32.00,0.00,0.00,NULL),(213,6,22,18.00,'reprobado','regular',18.00,0.00,0.00,NULL),(214,6,23,21.00,'reprobado','regular',21.00,0.00,0.00,NULL),(215,6,24,27.00,'reprobado','regular',27.00,0.00,0.00,NULL),(216,6,25,31.00,'reprobado','regular',31.00,0.00,0.00,NULL),(217,6,26,22.00,'reprobado','regular',22.00,0.00,0.00,NULL),(218,6,27,1.00,'reprobado','regular',1.00,0.00,0.00,NULL),(219,6,28,34.00,'reprobado','regular',34.00,0.00,0.00,NULL),(220,6,29,32.00,'reprobado','regular',32.00,0.00,0.00,NULL),(221,6,30,27.00,'reprobado','regular',27.00,0.00,0.00,NULL),(222,6,31,20.00,'reprobado','regular',20.00,0.00,0.00,NULL),(223,6,32,34.00,'reprobado','regular',34.00,0.00,0.00,NULL),(224,6,33,27.00,'reprobado','regular',27.00,0.00,0.00,NULL),(225,6,34,31.00,'reprobado','regular',31.00,0.00,0.00,NULL),(226,7,4,13.00,'reprobado','regular',13.00,0.00,0.00,NULL),(227,7,5,30.00,'reprobado','regular',30.00,0.00,0.00,NULL),(228,7,6,18.00,'reprobado','regular',18.00,0.00,0.00,NULL),(229,7,7,18.00,'reprobado','regular',18.00,0.00,0.00,NULL),(230,7,8,8.00,'reprobado','regular',8.00,0.00,0.00,NULL),(231,7,9,20.00,'reprobado','regular',20.00,0.00,0.00,NULL),(232,7,10,16.00,'reprobado','regular',16.00,0.00,0.00,NULL),(233,7,11,21.00,'reprobado','regular',21.00,0.00,0.00,NULL),(234,7,12,1.00,'reprobado','regular',1.00,0.00,0.00,NULL),(235,7,13,30.00,'reprobado','regular',30.00,0.00,0.00,NULL),(236,7,14,20.00,'reprobado','regular',20.00,0.00,0.00,NULL),(237,7,15,11.00,'reprobado','regular',11.00,0.00,0.00,NULL),(238,7,16,0.00,'reprobado','regular',0.00,0.00,0.00,NULL),(239,7,17,5.00,'reprobado','regular',5.00,0.00,0.00,NULL),(240,7,18,27.00,'reprobado','regular',27.00,0.00,0.00,NULL),(241,7,19,22.00,'reprobado','regular',22.00,0.00,0.00,NULL),(242,7,20,0.00,'reprobado','regular',0.00,0.00,0.00,NULL),(243,7,21,18.00,'reprobado','regular',18.00,0.00,0.00,NULL),(244,7,22,22.00,'reprobado','regular',22.00,0.00,0.00,NULL),(245,7,23,4.00,'reprobado','regular',4.00,0.00,0.00,NULL),(246,7,24,9.00,'reprobado','regular',9.00,0.00,0.00,NULL),(247,7,25,20.00,'reprobado','regular',20.00,0.00,0.00,NULL),(248,7,26,33.00,'reprobado','regular',33.00,0.00,0.00,NULL),(249,7,27,1.00,'reprobado','regular',1.00,0.00,0.00,NULL),(250,7,28,20.00,'reprobado','regular',20.00,0.00,0.00,NULL),(251,7,29,18.00,'reprobado','regular',18.00,0.00,0.00,NULL),(252,7,30,10.00,'reprobado','regular',10.00,0.00,0.00,NULL),(253,7,31,11.00,'reprobado','regular',11.00,0.00,0.00,NULL),(254,7,32,18.00,'reprobado','regular',18.00,0.00,0.00,NULL),(255,7,33,23.00,'reprobado','regular',23.00,0.00,0.00,NULL),(256,7,34,33.00,'reprobado','regular',33.00,0.00,0.00,NULL),(257,8,36,21.00,'reprobado','regular',21.00,0.00,0.00,NULL),(258,8,37,0.00,'reprobado','regular',0.00,0.00,0.00,NULL),(259,8,38,18.00,'reprobado','regular',18.00,0.00,0.00,NULL),(260,8,39,30.00,'reprobado','regular',30.00,0.00,0.00,NULL),(261,8,40,0.00,'reprobado','regular',0.00,0.00,0.00,NULL),(262,8,41,28.00,'reprobado','regular',28.00,0.00,0.00,NULL),(263,8,42,28.00,'reprobado','regular',28.00,0.00,0.00,NULL),(264,8,43,27.00,'reprobado','regular',27.00,0.00,0.00,NULL),(265,8,44,0.00,'reprobado','regular',0.00,0.00,0.00,NULL),(266,8,45,27.00,'reprobado','regular',27.00,0.00,0.00,NULL),(267,8,46,26.00,'reprobado','regular',26.00,0.00,0.00,NULL),(268,8,47,31.00,'reprobado','regular',31.00,0.00,0.00,NULL),(269,8,49,18.00,'reprobado','regular',18.00,0.00,0.00,NULL),(270,8,48,27.00,'reprobado','regular',27.00,0.00,0.00,NULL),(271,8,50,28.00,'reprobado','regular',28.00,0.00,0.00,NULL),(272,8,51,9.00,'reprobado','regular',9.00,0.00,0.00,NULL),(273,8,52,0.00,'reprobado','regular',0.00,0.00,0.00,NULL),(274,8,53,22.00,'reprobado','regular',22.00,0.00,0.00,NULL),(275,8,54,14.98,'reprobado','regular',14.98,0.00,0.00,NULL),(276,8,35,21.00,'reprobado','regular',21.00,0.00,0.00,NULL),(277,8,55,13.00,'reprobado','regular',13.00,0.00,0.00,NULL),(278,8,56,0.00,'reprobado','regular',0.00,0.00,0.00,NULL),(279,8,57,25.00,'reprobado','regular',25.00,0.00,0.00,NULL),(280,8,58,25.00,'reprobado','regular',25.00,0.00,0.00,NULL),(281,8,59,22.00,'reprobado','regular',22.00,0.00,0.00,NULL),(282,8,60,19.00,'reprobado','regular',19.00,0.00,0.00,NULL),(283,8,61,19.00,'reprobado','regular',19.00,0.00,0.00,NULL),(284,8,62,18.00,'reprobado','regular',18.00,0.00,0.00,NULL),(285,8,63,14.00,'reprobado','regular',14.00,0.00,0.00,NULL),(286,8,64,13.00,'reprobado','regular',13.00,0.00,0.00,NULL),(287,8,65,0.00,'reprobado','regular',0.00,0.00,0.00,NULL),(288,8,66,20.00,'reprobado','regular',20.00,0.00,0.00,NULL),(289,8,67,23.00,'reprobado','regular',23.00,0.00,0.00,NULL),(290,9,4,19.00,'reprobado','regular',19.00,0.00,0.00,NULL),(291,9,5,24.00,'reprobado','regular',24.00,0.00,0.00,NULL),(292,9,6,24.00,'reprobado','regular',24.00,0.00,0.00,NULL),(293,9,7,20.00,'reprobado','regular',20.00,0.00,0.00,NULL),(294,9,8,18.00,'reprobado','regular',18.00,0.00,0.00,NULL),(295,9,9,34.00,'reprobado','regular',34.00,0.00,0.00,NULL),(296,9,10,18.00,'reprobado','regular',18.00,0.00,0.00,NULL),(297,9,11,28.00,'reprobado','regular',28.00,0.00,0.00,NULL),(298,9,12,19.00,'reprobado','regular',19.00,0.00,0.00,NULL),(299,9,13,30.00,'reprobado','regular',30.00,0.00,0.00,NULL),(300,9,14,27.00,'reprobado','regular',27.00,0.00,0.00,NULL),(301,9,15,24.00,'reprobado','regular',24.00,0.00,0.00,NULL),(302,9,16,0.00,'reprobado','regular',0.00,0.00,0.00,NULL),(303,9,17,2.00,'reprobado','regular',2.00,0.00,0.00,NULL),(304,9,18,31.00,'reprobado','regular',31.00,0.00,0.00,NULL),(305,9,19,30.00,'reprobado','regular',30.00,0.00,0.00,NULL),(306,9,20,0.00,'reprobado','regular',0.00,0.00,0.00,NULL),(307,9,21,20.00,'reprobado','regular',20.00,0.00,0.00,NULL),(308,9,22,21.00,'reprobado','regular',21.00,0.00,0.00,NULL),(309,9,23,20.00,'reprobado','regular',20.00,0.00,0.00,NULL),(310,9,24,7.00,'reprobado','regular',7.00,0.00,0.00,NULL),(311,9,25,30.00,'reprobado','regular',30.00,0.00,0.00,NULL),(312,9,26,32.00,'reprobado','regular',32.00,0.00,0.00,NULL),(313,9,27,1.00,'reprobado','regular',1.00,0.00,0.00,NULL),(314,9,28,23.00,'reprobado','regular',23.00,0.00,0.00,NULL),(315,9,29,22.00,'reprobado','regular',22.00,0.00,0.00,NULL),(316,9,30,19.00,'reprobado','regular',19.00,0.00,0.00,NULL),(317,9,31,21.00,'reprobado','regular',21.00,0.00,0.00,NULL),(318,9,32,35.00,'reprobado','regular',35.00,0.00,0.00,NULL),(319,9,33,27.00,'reprobado','regular',27.00,0.00,0.00,NULL),(320,9,34,33.00,'reprobado','regular',33.00,0.00,0.00,NULL),(321,10,36,29.00,'reprobado','regular',29.00,0.00,0.00,NULL),(322,10,37,0.00,'reprobado','regular',0.00,0.00,0.00,NULL),(323,10,38,24.00,'reprobado','regular',24.00,0.00,0.00,NULL),(324,10,39,27.00,'reprobado','regular',27.00,0.00,0.00,NULL),(325,10,40,0.00,'reprobado','regular',0.00,0.00,0.00,NULL),(326,10,41,27.00,'reprobado','regular',27.00,0.00,0.00,NULL),(327,10,42,28.00,'reprobado','regular',28.00,0.00,0.00,NULL),(328,10,43,31.00,'reprobado','regular',31.00,0.00,0.00,NULL),(329,10,44,2.00,'reprobado','regular',2.00,0.00,0.00,NULL),(330,10,45,34.00,'reprobado','regular',34.00,0.00,0.00,NULL),(331,10,46,28.00,'reprobado','regular',28.00,0.00,0.00,NULL),(332,10,47,30.00,'reprobado','regular',30.00,0.00,0.00,NULL),(333,10,49,26.00,'reprobado','regular',26.00,0.00,0.00,NULL),(334,10,48,32.00,'reprobado','regular',32.00,0.00,0.00,NULL),(335,10,50,30.00,'reprobado','regular',30.00,0.00,0.00,NULL),(336,10,51,21.00,'reprobado','regular',21.00,0.00,0.00,NULL),(337,10,52,0.00,'reprobado','regular',0.00,0.00,0.00,NULL),(338,10,53,27.00,'reprobado','regular',27.00,0.00,0.00,NULL),(339,10,54,28.00,'reprobado','regular',28.00,0.00,0.00,NULL),(340,10,35,21.00,'reprobado','regular',21.00,0.00,0.00,NULL),(341,10,55,27.00,'reprobado','regular',27.00,0.00,0.00,NULL),(342,10,56,0.00,'reprobado','regular',0.00,0.00,0.00,NULL),(343,10,57,28.00,'reprobado','regular',28.00,0.00,0.00,NULL),(344,10,58,30.00,'reprobado','regular',30.00,0.00,0.00,NULL),(345,10,59,28.00,'reprobado','regular',28.00,0.00,0.00,NULL),(346,10,60,30.00,'reprobado','regular',30.00,0.00,0.00,NULL),(347,10,61,33.00,'reprobado','regular',33.00,0.00,0.00,NULL),(348,10,62,28.00,'reprobado','regular',28.00,0.00,0.00,NULL),(349,10,63,26.00,'reprobado','regular',26.00,0.00,0.00,NULL),(350,10,64,25.00,'reprobado','regular',25.00,0.00,0.00,NULL),(351,10,65,0.00,'reprobado','regular',0.00,0.00,0.00,NULL),(352,10,66,29.00,'reprobado','regular',29.00,0.00,0.00,NULL),(353,10,67,31.00,'reprobado','regular',31.00,0.00,0.00,NULL),(354,11,4,15.00,'reprobado','regular',15.00,0.00,0.00,NULL),(355,11,5,19.00,'reprobado','regular',19.00,0.00,0.00,NULL),(356,11,6,14.00,'reprobado','regular',14.00,0.00,0.00,NULL),(357,11,7,20.00,'reprobado','regular',20.00,0.00,0.00,NULL),(358,11,8,19.00,'reprobado','regular',19.00,0.00,0.00,NULL),(359,11,9,24.00,'reprobado','regular',24.00,0.00,0.00,NULL),(360,11,10,21.00,'reprobado','regular',21.00,0.00,0.00,NULL),(361,11,11,23.00,'reprobado','regular',23.00,0.00,0.00,NULL),(362,11,12,17.00,'reprobado','regular',17.00,0.00,0.00,NULL),(363,11,13,25.00,'reprobado','regular',25.00,0.00,0.00,NULL),(364,11,14,24.00,'reprobado','regular',24.00,0.00,0.00,NULL),(365,11,15,18.00,'reprobado','regular',18.00,0.00,0.00,NULL),(366,11,16,0.00,'reprobado','regular',0.00,0.00,0.00,NULL),(367,11,17,18.00,'reprobado','regular',18.00,0.00,0.00,NULL),(368,11,18,24.00,'reprobado','regular',24.00,0.00,0.00,NULL),(369,11,19,23.00,'reprobado','regular',23.00,0.00,0.00,NULL),(370,11,20,0.00,'reprobado','regular',0.00,0.00,0.00,NULL),(371,11,21,24.00,'reprobado','regular',24.00,0.00,0.00,NULL),(372,11,22,19.00,'reprobado','regular',19.00,0.00,0.00,NULL),(373,11,23,25.00,'reprobado','regular',25.00,0.00,0.00,NULL),(374,11,24,0.00,'reprobado','regular',0.00,0.00,0.00,NULL),(375,11,25,26.00,'reprobado','regular',26.00,0.00,0.00,NULL),(376,11,26,32.00,'reprobado','regular',32.00,0.00,0.00,NULL),(377,11,27,1.00,'reprobado','regular',1.00,0.00,0.00,NULL),(378,11,28,27.00,'reprobado','regular',27.00,0.00,0.00,NULL),(379,11,29,18.00,'reprobado','regular',18.00,0.00,0.00,NULL),(380,11,30,22.00,'reprobado','regular',22.00,0.00,0.00,NULL),(381,11,31,14.00,'reprobado','regular',14.00,0.00,0.00,NULL),(382,11,32,23.00,'reprobado','regular',23.00,0.00,0.00,NULL),(383,11,33,21.00,'reprobado','regular',21.00,0.00,0.00,NULL),(384,11,34,27.00,'reprobado','regular',27.00,0.00,0.00,NULL),(385,12,36,23.00,'reprobado','regular',23.00,0.00,0.00,NULL),(386,12,37,0.00,'reprobado','regular',0.00,0.00,0.00,NULL),(387,12,38,20.00,'reprobado','regular',20.00,0.00,0.00,NULL),(388,12,39,18.00,'reprobado','regular',18.00,0.00,0.00,NULL),(389,12,40,0.00,'reprobado','regular',0.00,0.00,0.00,NULL),(390,12,41,24.00,'reprobado','regular',24.00,0.00,0.00,NULL),(391,12,42,16.00,'reprobado','regular',16.00,0.00,0.00,NULL),(392,12,43,22.00,'reprobado','regular',22.00,0.00,0.00,NULL),(393,12,44,0.00,'reprobado','regular',0.00,0.00,0.00,NULL),(394,12,45,31.00,'reprobado','regular',31.00,0.00,0.00,NULL),(395,12,46,20.00,'reprobado','regular',20.00,0.00,0.00,NULL),(396,12,47,26.00,'reprobado','regular',26.00,0.00,0.00,NULL),(397,12,49,18.00,'reprobado','regular',18.00,0.00,0.00,NULL),(398,12,48,18.00,'reprobado','regular',18.00,0.00,0.00,NULL),(399,12,50,22.00,'reprobado','regular',22.00,0.00,0.00,NULL),(400,12,51,19.00,'reprobado','regular',19.00,0.00,0.00,NULL),(401,12,52,0.00,'reprobado','regular',0.00,0.00,0.00,NULL),(402,12,53,24.00,'reprobado','regular',24.00,0.00,0.00,NULL),(403,12,54,15.00,'reprobado','regular',15.00,0.00,0.00,NULL),(404,12,35,18.00,'reprobado','regular',18.00,0.00,0.00,NULL),(405,12,55,20.00,'reprobado','regular',20.00,0.00,0.00,NULL),(406,12,56,0.00,'reprobado','regular',0.00,0.00,0.00,NULL),(407,12,57,19.00,'reprobado','regular',19.00,0.00,0.00,NULL),(408,12,58,20.00,'reprobado','regular',20.00,0.00,0.00,NULL),(409,12,59,23.00,'reprobado','regular',23.00,0.00,0.00,NULL),(410,12,60,18.00,'reprobado','regular',18.00,0.00,0.00,NULL),(411,12,61,18.00,'reprobado','regular',18.00,0.00,0.00,NULL),(412,12,62,22.00,'reprobado','regular',22.00,0.00,0.00,NULL),(413,12,63,23.00,'reprobado','regular',23.00,0.00,0.00,NULL),(414,12,64,23.00,'reprobado','regular',23.00,0.00,0.00,NULL),(415,12,65,0.00,'reprobado','regular',0.00,0.00,0.00,NULL),(416,12,66,20.00,'reprobado','regular',20.00,0.00,0.00,NULL),(417,12,67,19.00,'reprobado','regular',19.00,0.00,0.00,NULL);
/*!40000 ALTER TABLE `grade_report_details` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `grade_reports`
--

DROP TABLE IF EXISTS `grade_reports`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `grade_reports` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `materia_id` int(11) NOT NULL,
  `periodo` varchar(50) DEFAULT NULL,
  `observaciones` text DEFAULT NULL,
  `archivo_url` varchar(500) DEFAULT NULL,
  `cargado_por` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `materia_id` (`materia_id`),
  KEY `cargado_por` (`cargado_por`),
  CONSTRAINT `grade_reports_ibfk_1` FOREIGN KEY (`materia_id`) REFERENCES `materias` (`id`) ON DELETE CASCADE,
  CONSTRAINT `grade_reports_ibfk_2` FOREIGN KEY (`cargado_por`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `grade_reports`
--

LOCK TABLES `grade_reports` WRITE;
/*!40000 ALTER TABLE `grade_reports` DISABLE KEYS */;
INSERT INTO `grade_reports` VALUES (1,15,'2026-I',NULL,NULL,8,'2026-04-21 21:12:40','2026-04-21 21:12:40'),(2,16,'2026-I',NULL,NULL,8,'2026-04-21 21:16:23','2026-04-21 21:16:23'),(3,4,'2026-I',NULL,NULL,8,'2026-04-21 21:25:50','2026-04-21 21:25:50'),(4,6,'2026-I',NULL,NULL,8,'2026-04-21 21:30:06','2026-04-21 21:30:06'),(5,5,'2026-I',NULL,NULL,8,'2026-04-21 21:34:03','2026-04-21 21:34:03'),(6,7,'2026-I',NULL,NULL,8,'2026-04-21 21:37:16','2026-04-21 21:37:16'),(7,8,'2026-I',NULL,NULL,8,'2026-04-21 21:41:19','2026-04-21 21:41:19'),(8,9,'2026-I',NULL,NULL,8,'2026-04-21 21:44:36','2026-04-21 21:44:36'),(9,10,'2026-I',NULL,NULL,8,'2026-04-21 21:49:08','2026-04-21 21:49:08'),(10,12,'2026-I',NULL,NULL,8,'2026-04-21 21:51:45','2026-04-21 21:51:45'),(11,13,'2026-I',NULL,NULL,8,'2026-04-21 21:54:21','2026-04-21 21:54:21'),(12,14,'2026-I',NULL,NULL,8,'2026-04-21 21:56:49','2026-04-21 21:56:49');
/*!40000 ALTER TABLE `grade_reports` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `grupos_tarea`
--

DROP TABLE IF EXISTS `grupos_tarea`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `grupos_tarea` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tarea_id` int(11) NOT NULL,
  `materia_id` int(11) NOT NULL,
  `nombre_grupo` varchar(100) NOT NULL,
  `creado_por` int(11) NOT NULL,
  `fecha_creacion` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `tarea_id` (`tarea_id`),
  KEY `materia_id` (`materia_id`),
  KEY `creado_por` (`creado_por`),
  CONSTRAINT `grupos_tarea_ibfk_1` FOREIGN KEY (`tarea_id`) REFERENCES `tareas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `grupos_tarea_ibfk_2` FOREIGN KEY (`materia_id`) REFERENCES `materias` (`id`) ON DELETE CASCADE,
  CONSTRAINT `grupos_tarea_ibfk_3` FOREIGN KEY (`creado_por`) REFERENCES `estudiantes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `grupos_tarea`
--

LOCK TABLES `grupos_tarea` WRITE;
/*!40000 ALTER TABLE `grupos_tarea` DISABLE KEYS */;
/*!40000 ALTER TABLE `grupos_tarea` ENABLE KEYS */;
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
INSERT INTO `inscripciones` VALUES (13,4,4,'2026-04-19'),(14,5,4,'2026-04-19'),(15,6,4,'2026-04-19'),(16,7,4,'2026-04-19'),(17,8,4,'2026-04-19'),(18,9,4,'2026-04-19'),(19,10,4,'2026-04-19'),(20,11,4,'2026-04-19'),(21,12,4,'2026-04-19'),(22,13,4,'2026-04-19'),(23,14,4,'2026-04-19'),(24,15,4,'2026-04-19'),(25,16,4,'2026-04-19'),(26,17,4,'2026-04-19'),(27,18,4,'2026-04-19'),(28,19,4,'2026-04-19'),(29,20,4,'2026-04-19'),(30,21,4,'2026-04-19'),(31,22,4,'2026-04-19'),(32,23,4,'2026-04-19'),(33,24,4,'2026-04-19'),(34,25,4,'2026-04-19'),(35,26,4,'2026-04-19'),(36,27,4,'2026-04-19'),(37,28,4,'2026-04-19'),(38,29,4,'2026-04-19'),(39,30,4,'2026-04-19'),(40,31,4,'2026-04-19'),(41,32,4,'2026-04-19'),(42,33,4,'2026-04-19'),(43,34,4,'2026-04-19'),(44,35,6,'2026-04-19'),(45,35,5,'2026-04-19'),(47,35,12,'2026-04-19'),(48,35,14,'2026-04-19'),(49,35,16,'2026-04-19'),(50,36,6,'2026-04-19'),(51,36,5,'2026-04-19'),(53,36,12,'2026-04-19'),(54,36,14,'2026-04-19'),(55,36,16,'2026-04-19'),(56,37,6,'2026-04-19'),(57,37,5,'2026-04-19'),(59,37,12,'2026-04-19'),(60,37,14,'2026-04-19'),(61,37,16,'2026-04-19'),(62,38,6,'2026-04-19'),(63,38,5,'2026-04-19'),(65,38,12,'2026-04-19'),(66,38,14,'2026-04-19'),(67,38,16,'2026-04-19'),(68,39,6,'2026-04-19'),(69,39,5,'2026-04-19'),(71,39,12,'2026-04-19'),(72,39,14,'2026-04-19'),(73,39,16,'2026-04-19'),(74,40,6,'2026-04-19'),(75,40,5,'2026-04-19'),(77,40,12,'2026-04-19'),(78,40,14,'2026-04-19'),(79,40,16,'2026-04-19'),(80,41,6,'2026-04-19'),(81,41,5,'2026-04-19'),(83,41,12,'2026-04-19'),(84,41,14,'2026-04-19'),(85,41,16,'2026-04-19'),(86,42,6,'2026-04-19'),(87,42,5,'2026-04-19'),(89,42,12,'2026-04-19'),(90,42,14,'2026-04-19'),(91,42,16,'2026-04-19'),(92,43,6,'2026-04-19'),(93,43,5,'2026-04-19'),(95,43,12,'2026-04-19'),(96,43,14,'2026-04-19'),(97,43,16,'2026-04-19'),(98,44,6,'2026-04-19'),(99,44,5,'2026-04-19'),(101,44,12,'2026-04-19'),(102,44,14,'2026-04-19'),(103,44,16,'2026-04-19'),(104,45,6,'2026-04-19'),(105,45,5,'2026-04-19'),(107,45,12,'2026-04-19'),(108,45,14,'2026-04-19'),(109,45,16,'2026-04-19'),(110,46,6,'2026-04-19'),(111,46,5,'2026-04-19'),(113,46,12,'2026-04-19'),(114,46,14,'2026-04-19'),(115,46,16,'2026-04-19'),(116,47,6,'2026-04-19'),(117,47,5,'2026-04-19'),(119,47,12,'2026-04-19'),(120,47,14,'2026-04-19'),(121,47,16,'2026-04-19'),(122,48,6,'2026-04-19'),(123,48,5,'2026-04-19'),(125,48,12,'2026-04-19'),(126,48,14,'2026-04-19'),(127,48,16,'2026-04-19'),(128,49,6,'2026-04-19'),(129,49,5,'2026-04-19'),(131,49,12,'2026-04-19'),(132,49,14,'2026-04-19'),(133,49,16,'2026-04-19'),(134,50,6,'2026-04-19'),(135,50,5,'2026-04-19'),(137,50,12,'2026-04-19'),(138,50,14,'2026-04-19'),(139,50,16,'2026-04-19'),(140,51,6,'2026-04-19'),(141,51,5,'2026-04-19'),(143,51,12,'2026-04-19'),(144,51,14,'2026-04-19'),(145,51,16,'2026-04-19'),(146,52,6,'2026-04-19'),(147,52,5,'2026-04-19'),(149,52,12,'2026-04-19'),(150,52,14,'2026-04-19'),(151,52,16,'2026-04-19'),(152,53,6,'2026-04-19'),(153,53,5,'2026-04-19'),(155,53,12,'2026-04-19'),(156,53,14,'2026-04-19'),(157,53,16,'2026-04-19'),(158,54,6,'2026-04-19'),(159,54,5,'2026-04-19'),(161,54,12,'2026-04-19'),(162,54,14,'2026-04-19'),(163,54,16,'2026-04-19'),(164,55,6,'2026-04-19'),(165,55,5,'2026-04-19'),(167,55,12,'2026-04-19'),(168,55,14,'2026-04-19'),(169,55,16,'2026-04-19'),(170,56,6,'2026-04-19'),(171,56,5,'2026-04-19'),(173,56,12,'2026-04-19'),(174,56,14,'2026-04-19'),(175,56,16,'2026-04-19'),(176,57,6,'2026-04-19'),(177,57,5,'2026-04-19'),(179,57,12,'2026-04-19'),(180,57,14,'2026-04-19'),(181,57,16,'2026-04-19'),(182,58,6,'2026-04-19'),(183,58,5,'2026-04-19'),(185,58,12,'2026-04-19'),(186,58,14,'2026-04-19'),(187,58,16,'2026-04-19'),(188,59,6,'2026-04-19'),(189,59,5,'2026-04-19'),(191,59,12,'2026-04-19'),(192,59,14,'2026-04-19'),(193,59,16,'2026-04-19'),(194,60,6,'2026-04-19'),(195,60,5,'2026-04-19'),(197,60,12,'2026-04-19'),(198,60,14,'2026-04-19'),(199,60,16,'2026-04-19'),(200,61,6,'2026-04-19'),(201,61,5,'2026-04-19'),(203,61,12,'2026-04-19'),(204,61,14,'2026-04-19'),(205,61,16,'2026-04-19'),(206,62,6,'2026-04-19'),(207,62,5,'2026-04-19'),(209,62,12,'2026-04-19'),(210,62,14,'2026-04-19'),(211,62,16,'2026-04-19'),(212,63,6,'2026-04-19'),(213,63,5,'2026-04-19'),(215,63,12,'2026-04-19'),(216,63,14,'2026-04-19'),(217,63,16,'2026-04-19'),(218,64,6,'2026-04-19'),(219,64,5,'2026-04-19'),(221,64,12,'2026-04-19'),(222,64,14,'2026-04-19'),(223,64,16,'2026-04-19'),(224,65,6,'2026-04-19'),(225,65,5,'2026-04-19'),(227,65,12,'2026-04-19'),(228,65,14,'2026-04-19'),(229,65,16,'2026-04-19'),(230,66,6,'2026-04-19'),(231,66,5,'2026-04-19'),(233,66,12,'2026-04-19'),(234,66,14,'2026-04-19'),(235,66,16,'2026-04-19'),(236,67,6,'2026-04-19'),(237,67,5,'2026-04-19'),(239,67,12,'2026-04-19'),(240,67,14,'2026-04-19'),(241,67,16,'2026-04-19'),(242,50,9,'2026-04-19'),(243,4,7,'2026-04-19'),(245,4,10,'2026-04-19'),(246,4,13,'2026-04-19'),(247,4,15,'2026-04-19'),(249,36,9,'2026-04-19'),(250,10,7,'2026-04-19'),(252,5,7,'2026-04-19'),(253,6,7,'2026-04-19'),(254,7,7,'2026-04-19'),(255,8,7,'2026-04-19'),(256,9,7,'2026-04-19'),(258,11,7,'2026-04-19'),(259,12,7,'2026-04-19'),(260,13,7,'2026-04-19'),(261,14,7,'2026-04-19'),(262,15,7,'2026-04-19'),(263,16,7,'2026-04-19'),(264,17,7,'2026-04-19'),(265,18,7,'2026-04-19'),(266,19,7,'2026-04-19'),(267,20,7,'2026-04-19'),(268,21,7,'2026-04-19'),(269,22,7,'2026-04-19'),(270,23,7,'2026-04-19'),(271,24,7,'2026-04-19'),(272,25,7,'2026-04-19'),(273,26,7,'2026-04-19'),(274,27,7,'2026-04-19'),(275,28,7,'2026-04-19'),(276,29,7,'2026-04-19'),(277,30,7,'2026-04-19'),(278,31,7,'2026-04-19'),(279,32,7,'2026-04-19'),(280,33,7,'2026-04-19'),(281,34,7,'2026-04-19'),(283,5,13,'2026-04-19'),(284,6,13,'2026-04-19'),(285,7,13,'2026-04-19'),(286,8,13,'2026-04-19'),(287,9,13,'2026-04-19'),(288,10,13,'2026-04-19'),(289,11,13,'2026-04-19'),(290,12,13,'2026-04-19'),(291,13,13,'2026-04-19'),(292,14,13,'2026-04-19'),(293,15,13,'2026-04-19'),(294,16,13,'2026-04-19'),(295,17,13,'2026-04-19'),(296,18,13,'2026-04-19'),(297,19,13,'2026-04-19'),(298,20,13,'2026-04-19'),(299,21,13,'2026-04-19'),(300,22,13,'2026-04-19'),(301,23,13,'2026-04-19'),(302,24,13,'2026-04-19'),(303,25,13,'2026-04-19'),(304,26,13,'2026-04-19'),(305,27,13,'2026-04-19'),(306,28,13,'2026-04-19'),(307,29,13,'2026-04-19'),(308,30,13,'2026-04-19'),(309,31,13,'2026-04-19'),(310,32,13,'2026-04-19'),(311,33,13,'2026-04-19'),(312,34,13,'2026-04-19'),(346,35,9,'2026-04-19'),(358,37,9,'2026-04-19'),(364,38,9,'2026-04-19'),(370,39,9,'2026-04-19'),(376,40,9,'2026-04-19'),(382,41,9,'2026-04-19'),(388,42,9,'2026-04-19'),(394,43,9,'2026-04-19'),(400,44,9,'2026-04-19'),(406,45,9,'2026-04-19'),(412,46,9,'2026-04-19'),(418,47,9,'2026-04-19'),(424,48,9,'2026-04-19'),(430,49,9,'2026-04-19'),(442,51,9,'2026-04-19'),(448,52,9,'2026-04-19'),(454,53,9,'2026-04-19'),(460,54,9,'2026-04-19'),(466,55,9,'2026-04-19'),(472,56,9,'2026-04-19'),(478,57,9,'2026-04-19'),(484,58,9,'2026-04-19'),(490,59,9,'2026-04-19'),(496,60,9,'2026-04-19'),(502,61,9,'2026-04-19'),(508,62,9,'2026-04-19'),(514,63,9,'2026-04-19'),(520,64,9,'2026-04-19'),(526,65,9,'2026-04-19'),(532,66,9,'2026-04-19'),(538,67,9,'2026-04-19'),(551,5,10,'2026-04-19'),(553,5,15,'2026-04-19'),(557,6,10,'2026-04-19'),(559,6,15,'2026-04-19'),(563,7,10,'2026-04-19'),(565,7,15,'2026-04-19'),(569,8,10,'2026-04-19'),(571,8,15,'2026-04-19'),(575,9,10,'2026-04-19'),(577,9,15,'2026-04-19'),(581,10,10,'2026-04-19'),(583,10,15,'2026-04-19'),(587,11,10,'2026-04-19'),(589,11,15,'2026-04-19'),(593,12,10,'2026-04-19'),(595,12,15,'2026-04-19'),(599,13,10,'2026-04-19'),(601,13,15,'2026-04-19'),(605,14,10,'2026-04-19'),(607,14,15,'2026-04-19'),(611,15,10,'2026-04-19'),(613,15,15,'2026-04-19'),(617,16,10,'2026-04-19'),(619,16,15,'2026-04-19'),(623,17,10,'2026-04-19'),(625,17,15,'2026-04-19'),(629,18,10,'2026-04-19'),(631,18,15,'2026-04-19'),(635,19,10,'2026-04-19'),(637,19,15,'2026-04-19'),(641,20,10,'2026-04-19'),(643,20,15,'2026-04-19'),(647,21,10,'2026-04-19'),(649,21,15,'2026-04-19'),(653,22,10,'2026-04-19'),(655,22,15,'2026-04-19'),(659,23,10,'2026-04-19'),(661,23,15,'2026-04-19'),(665,24,10,'2026-04-19'),(667,24,15,'2026-04-19'),(671,25,10,'2026-04-19'),(673,25,15,'2026-04-19'),(677,26,10,'2026-04-19'),(679,26,15,'2026-04-19'),(683,27,10,'2026-04-19'),(685,27,15,'2026-04-19'),(689,28,10,'2026-04-19'),(691,28,15,'2026-04-19'),(695,29,10,'2026-04-19'),(697,29,15,'2026-04-19'),(701,30,10,'2026-04-19'),(703,30,15,'2026-04-19'),(707,31,10,'2026-04-19'),(709,31,15,'2026-04-19'),(713,32,10,'2026-04-19'),(715,32,15,'2026-04-19'),(719,33,10,'2026-04-19'),(721,33,15,'2026-04-19'),(725,34,10,'2026-04-19'),(727,34,15,'2026-04-19'),(926,4,8,'2026-04-19'),(927,5,8,'2026-04-19'),(928,6,8,'2026-04-19'),(929,7,8,'2026-04-19'),(930,8,8,'2026-04-19'),(931,9,8,'2026-04-19'),(932,10,8,'2026-04-19'),(933,11,8,'2026-04-19'),(934,12,8,'2026-04-19'),(935,13,8,'2026-04-19'),(936,14,8,'2026-04-19'),(937,15,8,'2026-04-19'),(938,16,8,'2026-04-19'),(939,17,8,'2026-04-19'),(940,18,8,'2026-04-19'),(941,19,8,'2026-04-19'),(942,20,8,'2026-04-19'),(943,21,8,'2026-04-19'),(944,22,8,'2026-04-19'),(945,23,8,'2026-04-19'),(946,24,8,'2026-04-19'),(947,25,8,'2026-04-19'),(948,26,8,'2026-04-19'),(949,27,8,'2026-04-19'),(950,28,8,'2026-04-19'),(951,29,8,'2026-04-19'),(952,30,8,'2026-04-19'),(953,31,8,'2026-04-19'),(954,32,8,'2026-04-19'),(955,33,8,'2026-04-19'),(956,34,8,'2026-04-19');
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
-- Table structure for table `miembros_grupo`
--

DROP TABLE IF EXISTS `miembros_grupo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `miembros_grupo` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `grupo_id` int(11) NOT NULL,
  `tarea_id` int(11) NOT NULL,
  `estudiante_id` int(11) NOT NULL,
  `fecha_union` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_student_per_task` (`tarea_id`,`estudiante_id`),
  KEY `grupo_id` (`grupo_id`),
  KEY `estudiante_id` (`estudiante_id`),
  CONSTRAINT `miembros_grupo_ibfk_1` FOREIGN KEY (`grupo_id`) REFERENCES `grupos_tarea` (`id`) ON DELETE CASCADE,
  CONSTRAINT `miembros_grupo_ibfk_2` FOREIGN KEY (`tarea_id`) REFERENCES `tareas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `miembros_grupo_ibfk_3` FOREIGN KEY (`estudiante_id`) REFERENCES `estudiantes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `miembros_grupo`
--

LOCK TABLES `miembros_grupo` WRITE;
/*!40000 ALTER TABLE `miembros_grupo` DISABLE KEYS */;
/*!40000 ALTER TABLE `miembros_grupo` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notification_reviews`
--

DROP TABLE IF EXISTS `notification_reviews`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notification_reviews` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `notification_id` int(11) NOT NULL,
  `docente_id` int(11) NOT NULL,
  `reviewed_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_notification_review` (`notification_id`,`docente_id`),
  KEY `docente_id` (`docente_id`),
  CONSTRAINT `notification_reviews_ibfk_1` FOREIGN KEY (`notification_id`) REFERENCES `notifications` (`id`) ON DELETE CASCADE,
  CONSTRAINT `notification_reviews_ibfk_2` FOREIGN KEY (`docente_id`) REFERENCES `docentes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notification_reviews`
--

LOCK TABLES `notification_reviews` WRITE;
/*!40000 ALTER TABLE `notification_reviews` DISABLE KEYS */;
INSERT INTO `notification_reviews` VALUES (1,1,3,'2026-04-21 20:13:17');
/*!40000 ALTER TABLE `notification_reviews` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `carrera_id` int(11) NOT NULL,
  `tipo` enum('informativa','emergencia','institucional') NOT NULL,
  `titulo` varchar(255) NOT NULL,
  `mensaje` text NOT NULL,
  `creado_por` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `carrera_id` (`carrera_id`),
  KEY `creado_por` (`creado_por`),
  CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`carrera_id`) REFERENCES `carreras` (`id`) ON DELETE CASCADE,
  CONSTRAINT `notifications_ibfk_2` FOREIGN KEY (`creado_por`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
INSERT INTO `notifications` VALUES (1,2,'informativa','Kermesse','Kermesse Fiesta ',8,'2026-04-21 20:12:58');
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
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
-- Table structure for table `presentaciones`
--

DROP TABLE IF EXISTS `presentaciones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `presentaciones` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `docente_id` int(11) NOT NULL,
  `titulo` varchar(200) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `archivo_nombre` varchar(300) DEFAULT NULL,
  `archivo_path` varchar(500) DEFAULT NULL,
  `enlace_url` varchar(1000) DEFAULT NULL,
  `tipo_archivo` enum('pdf','pptx','link') NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `docente_id` (`docente_id`),
  CONSTRAINT `presentaciones_ibfk_1` FOREIGN KEY (`docente_id`) REFERENCES `docentes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `presentaciones`
--

LOCK TABLES `presentaciones` WRITE;
/*!40000 ALTER TABLE `presentaciones` DISABLE KEYS */;
INSERT INTO `presentaciones` VALUES (2,3,'Circuitos Logicos','Boole',NULL,NULL,'https://docs.google.com/presentation/d/1t_jvnHZ0VUZecP9wEH3xjnTvqE6-7Aan/edit?usp=sharing&ouid=113228318487920911465&rtpof=true&sd=true','link','2026-04-27 07:47:44');
/*!40000 ALTER TABLE `presentaciones` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `student_permission_requests`
--

DROP TABLE IF EXISTS `student_permission_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student_permission_requests` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `estudiante_id` int(11) NOT NULL,
  `materia_id` int(11) NOT NULL,
  `tipo` enum('carta_permiso','justificacion') NOT NULL DEFAULT 'justificacion',
  `fecha_desde` date NOT NULL,
  `fecha_hasta` date NOT NULL,
  `horas_detalle` varchar(255) DEFAULT NULL,
  `detalle` text DEFAULT NULL,
  `documento_url` varchar(500) DEFAULT NULL,
  `registrado_por` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `estado` enum('pendiente','aprobado','rechazado') NOT NULL DEFAULT 'pendiente',
  `observacion_jefe` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `estudiante_id` (`estudiante_id`),
  KEY `materia_id` (`materia_id`),
  KEY `registrado_por` (`registrado_por`),
  CONSTRAINT `student_permission_requests_ibfk_1` FOREIGN KEY (`estudiante_id`) REFERENCES `estudiantes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `student_permission_requests_ibfk_2` FOREIGN KEY (`materia_id`) REFERENCES `materias` (`id`) ON DELETE CASCADE,
  CONSTRAINT `student_permission_requests_ibfk_3` FOREIGN KEY (`registrado_por`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `student_permission_requests`
--

LOCK TABLES `student_permission_requests` WRITE;
/*!40000 ALTER TABLE `student_permission_requests` DISABLE KEYS */;
INSERT INTO `student_permission_requests` VALUES (1,47,16,'carta_permiso','2026-04-22','2026-04-23','2',NULL,'/uploads/1776801759312-504202135.docx',8,'2026-04-21 20:02:39','pendiente',NULL),(2,4,7,'carta_permiso','2026-04-27','2026-04-27',NULL,'asdasd','/uploads/1777255605373-776596161.docx',10,'2026-04-27 02:06:45','pendiente',NULL),(5,4,15,'carta_permiso','2026-04-27','2026-04-27',NULL,'sd','/uploads/1777258028563-942715850.docx',10,'2026-04-27 02:47:08','aprobado',NULL);
/*!40000 ALTER TABLE `student_permission_requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tareas`
--

DROP TABLE IF EXISTS `tareas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tareas` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `materia_id` int(11) NOT NULL,
  `docente_id` int(11) NOT NULL,
  `titulo` varchar(200) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `fecha_asignacion` datetime DEFAULT current_timestamp(),
  `fecha_entrega` date DEFAULT NULL,
  `archivo_nombre` varchar(300) DEFAULT NULL,
  `archivo_path` varchar(500) DEFAULT NULL,
  `tipo_archivo` enum('pdf','pptx','word') DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `materia_id` (`materia_id`),
  KEY `docente_id` (`docente_id`),
  CONSTRAINT `tareas_ibfk_1` FOREIGN KEY (`materia_id`) REFERENCES `materias` (`id`) ON DELETE CASCADE,
  CONSTRAINT `tareas_ibfk_2` FOREIGN KEY (`docente_id`) REFERENCES `docentes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tareas`
--

LOCK TABLES `tareas` WRITE;
/*!40000 ALTER TABLE `tareas` DISABLE KEYS */;
INSERT INTO `tareas` VALUES (1,16,3,'Ejercicios de Circuitos','Realizar la serie de ejercicios circuitos logicos','2026-04-28 07:11:46','2026-04-29','Cuaderno_CircuitVerse_50ejercicios.docx','/uploads/1777374706321-987713521.docx','word','2026-04-28 11:11:46');
/*!40000 ALTER TABLE `tareas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `unidades_instruccion`
--

DROP TABLE IF EXISTS `unidades_instruccion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `unidades_instruccion` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(200) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `tipo` varchar(50) DEFAULT 'simulador',
  `carrera_id` int(11) DEFAULT NULL,
  `orden` int(11) DEFAULT 1,
  `activo` tinyint(1) DEFAULT 1,
  `creado_por` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `carrera_id` (`carrera_id`),
  KEY `creado_por` (`creado_por`),
  CONSTRAINT `unidades_instruccion_ibfk_1` FOREIGN KEY (`carrera_id`) REFERENCES `carreras` (`id`) ON DELETE SET NULL,
  CONSTRAINT `unidades_instruccion_ibfk_2` FOREIGN KEY (`creado_por`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `unidades_instruccion`
--

LOCK TABLES `unidades_instruccion` WRITE;
/*!40000 ALTER TABLE `unidades_instruccion` DISABLE KEYS */;
INSERT INTO `unidades_instruccion` VALUES (1,'Circuitos Lógicos','Simulador interactivo de circuitos logicos. Ingresa una tabla de verdad y visualiza el circuito equivalente en tiempo real. Puedes alternar las entradas para ver como se propagan las senales.','simulador',NULL,1,1,NULL,'2026-04-27 07:03:43');
/*!40000 ALTER TABLE `unidades_instruccion` ENABLE KEYS */;
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
) ENGINE=InnoDB AUTO_INCREMENT=80 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuarios`
--

LOCK TABLES `usuarios` WRITE;
/*!40000 ALTER TABLE `usuarios` DISABLE KEYS */;
INSERT INTO `usuarios` VALUES (1,'Admin','Sistema','admin@uni.edu','$2b$10$cG2YJZjz9NRYMULZtbXkt.uc6lgK3HmCi09gphxikEwIZYZlov4tq','admin','0000001','70000000',NULL,'2026-04-19 15:27:38'),(2,'Carlos','Mendoza','jefe@uni.edu','$2b$10$cG2YJZjz9NRYMULZtbXkt.uc6lgK3HmCi09gphxikEwIZYZlov4tq','jefe','1234567','70000001',NULL,'2026-04-19 15:27:38'),(6,'Luis','Torres','estudiante2@uni.edu','$2b$10$cG2YJZjz9NRYMULZtbXkt.uc6lgK3HmCi09gphxikEwIZYZlov4tq','estudiante','5678901','70000005',NULL,'2026-04-19 15:27:38'),(7,'Sofía','Vargas','estudiante3@uni.edu','$2b$10$cG2YJZjz9NRYMULZtbXkt.uc6lgK3HmCi09gphxikEwIZYZlov4tq','estudiante','6789012','70000006',NULL,'2026-04-19 15:27:38'),(8,'Carlos','Azcarraga','tasajos@gmail.com','$2a$10$DcVxNS/5kx.rU3Fe3ADJr.KgAk8aq3BrOlcLJDPY2rXxSDe0ejm1S','jefe','4947021','70776212',NULL,'2026-04-19 15:33:30'),(9,'Carlos','Azcarraga Esquivel','cazcarraga@chakuy.com','$2a$10$PfWSVKHfaLCDqu3vzXMHWecgm4HLRvVyNOzkMMNllzmdkpJobd.ku','docente','4947021','70776212',NULL,'2026-04-19 16:58:24'),(10,'Wilmar','Alarcon Quintanilla','34008@est.uni.edu','$2a$10$L5Wv2bfxmFyRKwIbf4Ybx.hYOc9.ZdNImSJ71eBuwauT0si6vjSm6','estudiante','34008',NULL,NULL,'2026-04-19 19:25:41'),(11,'Humberto Sebastian','Caceres Illanes','33946@est.uni.edu','$2a$10$pFDrrhzRYmQn7t/p11evxOIU3dItEh1nWWjDb6002ZhRfSB4gGtHC','estudiante','33946',NULL,NULL,'2026-04-19 19:25:41'),(12,'Alan Rafael','Colque Huanca','33858@est.uni.edu','$2a$10$pFDrrhzRYmQn7t/p11evxOIU3dItEh1nWWjDb6002ZhRfSB4gGtHC','estudiante','33858',NULL,NULL,'2026-04-19 19:25:41'),(13,'Americo Jesus','Dorado Fuentes','31713@est.uni.edu','$2a$10$pFDrrhzRYmQn7t/p11evxOIU3dItEh1nWWjDb6002ZhRfSB4gGtHC','estudiante','31713',NULL,NULL,'2026-04-19 19:25:41'),(14,'Marco Antonio Deikar','Estrada Rodriguez','34237@est.uni.edu','$2a$10$pFDrrhzRYmQn7t/p11evxOIU3dItEh1nWWjDb6002ZhRfSB4gGtHC','estudiante','34237',NULL,NULL,'2026-04-19 19:25:41'),(15,'Victor Manuel','Faccio Mamani','34428@est.uni.edu','$2a$10$pFDrrhzRYmQn7t/p11evxOIU3dItEh1nWWjDb6002ZhRfSB4gGtHC','estudiante','34428',NULL,NULL,'2026-04-19 19:25:41'),(16,'Andres','Flores Flores','34261@est.uni.edu','$2a$10$pFDrrhzRYmQn7t/p11evxOIU3dItEh1nWWjDb6002ZhRfSB4gGtHC','estudiante','34261',NULL,NULL,'2026-04-19 19:25:41'),(17,'Mayte Abigail','Flores Torrico','33903@est.uni.edu','$2a$10$pFDrrhzRYmQn7t/p11evxOIU3dItEh1nWWjDb6002ZhRfSB4gGtHC','estudiante','33903',NULL,NULL,'2026-04-19 19:25:41'),(18,'David Andres','Franco Pinedo','34240@est.uni.edu','$2a$10$pFDrrhzRYmQn7t/p11evxOIU3dItEh1nWWjDb6002ZhRfSB4gGtHC','estudiante','34240',NULL,NULL,'2026-04-19 19:25:41'),(19,'Karylia','Guerrero Porco','35094@est.uni.edu','$2a$10$pFDrrhzRYmQn7t/p11evxOIU3dItEh1nWWjDb6002ZhRfSB4gGtHC','estudiante','35094',NULL,NULL,'2026-04-19 19:25:41'),(20,'Joshua Orlando','Guillen Anagua','34105@est.uni.edu','$2a$10$pFDrrhzRYmQn7t/p11evxOIU3dItEh1nWWjDb6002ZhRfSB4gGtHC','estudiante','34105',NULL,NULL,'2026-04-19 19:25:41'),(21,'Jamil Jhonatan','Illanes Merida','34823@est.uni.edu','$2a$10$pFDrrhzRYmQn7t/p11evxOIU3dItEh1nWWjDb6002ZhRfSB4gGtHC','estudiante','34823',NULL,NULL,'2026-04-19 19:25:41'),(22,'la Fuente Douglas Kevin','la Fuente','34325@est.uni.edu','$2a$10$pFDrrhzRYmQn7t/p11evxOIU3dItEh1nWWjDb6002ZhRfSB4gGtHC','estudiante','34325',NULL,NULL,'2026-04-19 19:25:41'),(23,'Angel Cristian','Lipa Chuquimia','35672@est.uni.edu','$2a$10$pFDrrhzRYmQn7t/p11evxOIU3dItEh1nWWjDb6002ZhRfSB4gGtHC','estudiante','35672',NULL,NULL,'2026-04-19 19:25:41'),(24,'Daniel','Mamani Nina','33769@est.uni.edu','$2a$10$pFDrrhzRYmQn7t/p11evxOIU3dItEh1nWWjDb6002ZhRfSB4gGtHC','estudiante','33769',NULL,NULL,'2026-04-19 19:25:41'),(25,'Jhovana','Mancera Villca','34076@est.uni.edu','$2a$10$pFDrrhzRYmQn7t/p11evxOIU3dItEh1nWWjDb6002ZhRfSB4gGtHC','estudiante','34076',NULL,NULL,'2026-04-19 19:25:41'),(26,'Oscar Alberto','Olmos Yucra','26807@est.uni.edu','$2a$10$pFDrrhzRYmQn7t/p11evxOIU3dItEh1nWWjDb6002ZhRfSB4gGtHC','estudiante','26807',NULL,NULL,'2026-04-19 19:25:41'),(27,'de Carvalho Thiago','Paes Pereira','35632@est.uni.edu','$2a$10$pFDrrhzRYmQn7t/p11evxOIU3dItEh1nWWjDb6002ZhRfSB4gGtHC','estudiante','35632',NULL,NULL,'2026-04-19 19:25:41'),(28,'Romina','Perez Romero','34561@est.uni.edu','$2a$10$pFDrrhzRYmQn7t/p11evxOIU3dItEh1nWWjDb6002ZhRfSB4gGtHC','estudiante','34561',NULL,NULL,'2026-04-19 19:25:41'),(29,'Ismael','Quiroz Flores','33844@est.uni.edu','$2a$10$pFDrrhzRYmQn7t/p11evxOIU3dItEh1nWWjDb6002ZhRfSB4gGtHC','estudiante','33844',NULL,NULL,'2026-04-19 19:25:41'),(30,'Cristian','Quispe Chambi','22718@est.uni.edu','$2a$10$pFDrrhzRYmQn7t/p11evxOIU3dItEh1nWWjDb6002ZhRfSB4gGtHC','estudiante','22718',NULL,NULL,'2026-04-19 19:25:41'),(31,'Emily Katherin','Revollo Apaza','34857@est.uni.edu','$2a$10$pFDrrhzRYmQn7t/p11evxOIU3dItEh1nWWjDb6002ZhRfSB4gGtHC','estudiante','34857',NULL,NULL,'2026-04-19 19:25:41'),(32,'Jhon Kevin','Reyes Marca','33972@est.uni.edu','$2a$10$pFDrrhzRYmQn7t/p11evxOIU3dItEh1nWWjDb6002ZhRfSB4gGtHC','estudiante','33972',NULL,NULL,'2026-04-19 19:25:41'),(33,'Misael','Rodriguez Garcia','21195@est.uni.edu','$2a$10$pFDrrhzRYmQn7t/p11evxOIU3dItEh1nWWjDb6002ZhRfSB4gGtHC','estudiante','21195',NULL,NULL,'2026-04-19 19:25:41'),(34,'Jheremy Daniel','Rojas Claros','35573@est.uni.edu','$2a$10$pFDrrhzRYmQn7t/p11evxOIU3dItEh1nWWjDb6002ZhRfSB4gGtHC','estudiante','35573',NULL,NULL,'2026-04-19 19:25:41'),(35,'Andree','Soza Balderrama','33948@est.uni.edu','$2a$10$pFDrrhzRYmQn7t/p11evxOIU3dItEh1nWWjDb6002ZhRfSB4gGtHC','estudiante','33948',NULL,NULL,'2026-04-19 19:25:41'),(36,'Derik Johan','Vallejos Camacho','35866@est.uni.edu','$2a$10$pFDrrhzRYmQn7t/p11evxOIU3dItEh1nWWjDb6002ZhRfSB4gGtHC','estudiante','35866',NULL,NULL,'2026-04-19 19:25:41'),(37,'Abdiel Jair','Vasques Romero','33790@est.uni.edu','$2a$10$pFDrrhzRYmQn7t/p11evxOIU3dItEh1nWWjDb6002ZhRfSB4gGtHC','estudiante','33790',NULL,NULL,'2026-04-19 19:25:41'),(38,'Jhery Alexander','Vasquez Rocha','33770@est.uni.edu','$2a$10$pFDrrhzRYmQn7t/p11evxOIU3dItEh1nWWjDb6002ZhRfSB4gGtHC','estudiante','33770',NULL,NULL,'2026-04-19 19:25:41'),(39,'Jhair Mijael','Veizaga Calderon','33900@est.uni.edu','$2a$10$pFDrrhzRYmQn7t/p11evxOIU3dItEh1nWWjDb6002ZhRfSB4gGtHC','estudiante','33900',NULL,NULL,'2026-04-19 19:25:41'),(40,'Sergio','Villegas Buitrago','35018@est.uni.edu','$2a$10$pFDrrhzRYmQn7t/p11evxOIU3dItEh1nWWjDb6002ZhRfSB4gGtHC','estudiante','35018',NULL,NULL,'2026-04-19 19:25:41'),(41,'Cesar','Lopez Julio','34067@est.uni.edu','$2a$10$.5MYojBIqhh9TyBWpl.sKu1whW/MGEX7yFwJRmqFgesiGe4MHfDCy','estudiante','34067',NULL,NULL,'2026-04-19 19:36:16'),(42,'Fabio Ramiro','Arnez Gil','33871@est.uni.edu','$2a$10$.5MYojBIqhh9TyBWpl.sKu1whW/MGEX7yFwJRmqFgesiGe4MHfDCy','estudiante','33871',NULL,NULL,'2026-04-19 19:36:16'),(43,'Rommel Regis','Avila Coronel','36001@est.uni.edu','$2a$10$.5MYojBIqhh9TyBWpl.sKu1whW/MGEX7yFwJRmqFgesiGe4MHfDCy','estudiante','36001',NULL,NULL,'2026-04-19 19:36:16'),(44,'Juan Andres','Barra Garcia','33924@est.uni.edu','$2a$10$.5MYojBIqhh9TyBWpl.sKu1whW/MGEX7yFwJRmqFgesiGe4MHfDCy','estudiante','33924',NULL,NULL,'2026-04-19 19:36:16'),(45,'Pablo Moises','Benito Navarro','36023@est.uni.edu','$2a$10$.5MYojBIqhh9TyBWpl.sKu1whW/MGEX7yFwJRmqFgesiGe4MHfDCy','estudiante','36023',NULL,NULL,'2026-04-19 19:36:16'),(46,'Jhonatan','Burgos Blas','35750@est.uni.edu','$2a$10$.5MYojBIqhh9TyBWpl.sKu1whW/MGEX7yFwJRmqFgesiGe4MHfDCy','estudiante','35750',NULL,NULL,'2026-04-19 19:36:16'),(47,'Maykol Andrei','Castrillo Marcoff','33860@est.uni.edu','$2a$10$.5MYojBIqhh9TyBWpl.sKu1whW/MGEX7yFwJRmqFgesiGe4MHfDCy','estudiante','33860',NULL,NULL,'2026-04-19 19:36:16'),(48,'Vanessa de los Angeles','Centellas Mercado','35635@est.uni.edu','$2a$10$.5MYojBIqhh9TyBWpl.sKu1whW/MGEX7yFwJRmqFgesiGe4MHfDCy','estudiante','35635',NULL,NULL,'2026-04-19 19:36:16'),(49,'Dayan Irene','Colque Calle','33816@est.uni.edu','$2a$10$.5MYojBIqhh9TyBWpl.sKu1whW/MGEX7yFwJRmqFgesiGe4MHfDCy','estudiante','33816',NULL,NULL,'2026-04-19 19:36:16'),(50,'Maria Elena','Colque Rasguido','36055@est.uni.edu','$2a$10$.5MYojBIqhh9TyBWpl.sKu1whW/MGEX7yFwJRmqFgesiGe4MHfDCy','estudiante','36055',NULL,NULL,'2026-04-19 19:36:16'),(51,'Jose Manuel','Conde Montecinos','35588@est.uni.edu','$2a$10$.5MYojBIqhh9TyBWpl.sKu1whW/MGEX7yFwJRmqFgesiGe4MHfDCy','estudiante','35588',NULL,NULL,'2026-04-19 19:36:16'),(52,'Lionel Eros','Costas Malue','33854@est.uni.edu','$2a$10$.5MYojBIqhh9TyBWpl.sKu1whW/MGEX7yFwJRmqFgesiGe4MHfDCy','estudiante','33854',NULL,NULL,'2026-04-19 19:36:16'),(53,'Paola Andrea','Diaz Guzman','34111@est.uni.edu','$2a$10$.5MYojBIqhh9TyBWpl.sKu1whW/MGEX7yFwJRmqFgesiGe4MHfDCy','estudiante','34111',NULL,NULL,'2026-04-19 19:36:16'),(54,'Erick Nelser','Flores Nina','35910@est.uni.edu','$2a$10$.5MYojBIqhh9TyBWpl.sKu1whW/MGEX7yFwJRmqFgesiGe4MHfDCy','estudiante','35910',NULL,NULL,'2026-04-19 19:36:16'),(55,'Carlos David','Flores Goyonaga','35000@est.uni.edu','$2a$10$.5MYojBIqhh9TyBWpl.sKu1whW/MGEX7yFwJRmqFgesiGe4MHfDCy','estudiante','35000',NULL,NULL,'2026-04-19 19:36:16'),(56,'Julia Tatiana','Frias Huanca','34932@est.uni.edu','$2a$10$.5MYojBIqhh9TyBWpl.sKu1whW/MGEX7yFwJRmqFgesiGe4MHfDCy','estudiante','34932',NULL,NULL,'2026-04-19 19:36:16'),(57,'Deneth Darkmark','Fuentes Mamani','34537@est.uni.edu','$2a$10$.5MYojBIqhh9TyBWpl.sKu1whW/MGEX7yFwJRmqFgesiGe4MHfDCy','estudiante','34537',NULL,NULL,'2026-04-19 19:36:16'),(58,'Giovanni','Gomez Marquina','33845@est.uni.edu','$2a$10$.5MYojBIqhh9TyBWpl.sKu1whW/MGEX7yFwJRmqFgesiGe4MHfDCy','estudiante','33845',NULL,NULL,'2026-04-19 19:36:16'),(59,'Leonard Sixto','Guarabia Jorge','35405@est.uni.edu','$2a$10$.5MYojBIqhh9TyBWpl.sKu1whW/MGEX7yFwJRmqFgesiGe4MHfDCy','estudiante','35405',NULL,NULL,'2026-04-19 19:36:16'),(60,'Shiro Moises','Guzman Hayashida','34239@est.uni.edu','$2a$10$.5MYojBIqhh9TyBWpl.sKu1whW/MGEX7yFwJRmqFgesiGe4MHfDCy','estudiante','34239',NULL,NULL,'2026-04-19 19:36:16'),(61,'Alberto','Mamani Huarachi','35101@est.uni.edu','$2a$10$.5MYojBIqhh9TyBWpl.sKu1whW/MGEX7yFwJRmqFgesiGe4MHfDCy','estudiante','35101',NULL,NULL,'2026-04-19 19:36:16'),(62,'David','Miranda Paniagua','22715@est.uni.edu','$2a$10$.5MYojBIqhh9TyBWpl.sKu1whW/MGEX7yFwJRmqFgesiGe4MHfDCy','estudiante','22715',NULL,NULL,'2026-04-19 19:36:16'),(63,'Leonel Jesus','Montaño Angulo','35809@est.uni.edu','$2a$10$.5MYojBIqhh9TyBWpl.sKu1whW/MGEX7yFwJRmqFgesiGe4MHfDCy','estudiante','35809',NULL,NULL,'2026-04-19 19:36:16'),(64,'Jheferson Angel','Montaño Torrico','35158@est.uni.edu','$2a$10$.5MYojBIqhh9TyBWpl.sKu1whW/MGEX7yFwJRmqFgesiGe4MHfDCy','estudiante','35158',NULL,NULL,'2026-04-19 19:36:16'),(65,'Jhasim Jamir','Pardo Galindo','20023@est.uni.edu','$2a$10$.5MYojBIqhh9TyBWpl.sKu1whW/MGEX7yFwJRmqFgesiGe4MHfDCy','estudiante','20023',NULL,NULL,'2026-04-19 19:36:16'),(66,'Jhoset Asli','Pinto Ugarte','35670@est.uni.edu','$2a$10$.5MYojBIqhh9TyBWpl.sKu1whW/MGEX7yFwJRmqFgesiGe4MHfDCy','estudiante','35670',NULL,NULL,'2026-04-19 19:36:16'),(67,'Arvin Alexander','Poma Roque','33765@est.uni.edu','$2a$10$.5MYojBIqhh9TyBWpl.sKu1whW/MGEX7yFwJRmqFgesiGe4MHfDCy','estudiante','33765',NULL,NULL,'2026-04-19 19:36:16'),(68,'Jhoel','Ponce Siles','35701@est.uni.edu','$2a$10$.5MYojBIqhh9TyBWpl.sKu1whW/MGEX7yFwJRmqFgesiGe4MHfDCy','estudiante','35701',NULL,NULL,'2026-04-19 19:36:16'),(69,'Paul Dussan','Quispe Viscarra','35444@est.uni.edu','$2a$10$.5MYojBIqhh9TyBWpl.sKu1whW/MGEX7yFwJRmqFgesiGe4MHfDCy','estudiante','35444',NULL,NULL,'2026-04-19 19:36:16'),(70,'Pedro Miguel','Ramirez Quiroz','35517@est.uni.edu','$2a$10$.5MYojBIqhh9TyBWpl.sKu1whW/MGEX7yFwJRmqFgesiGe4MHfDCy','estudiante','35517',NULL,NULL,'2026-04-19 19:36:16'),(71,'Elder','Vasquez Quispe','35964@est.uni.edu','$2a$10$.5MYojBIqhh9TyBWpl.sKu1whW/MGEX7yFwJRmqFgesiGe4MHfDCy','estudiante','35964',NULL,NULL,'2026-04-19 19:36:16'),(72,'Damaris Kate','Vela Arias','33795@est.uni.edu','$2a$10$.5MYojBIqhh9TyBWpl.sKu1whW/MGEX7yFwJRmqFgesiGe4MHfDCy','estudiante','33795',NULL,NULL,'2026-04-19 19:36:16'),(73,'Juan Daniel','Villazon Mamani','35967@est.uni.edu','$2a$10$.5MYojBIqhh9TyBWpl.sKu1whW/MGEX7yFwJRmqFgesiGe4MHfDCy','estudiante','35967',NULL,NULL,'2026-04-19 19:36:16'),(74,'Paola Isabel','Ortiz Diaz','ingles@unicen.edu.bo','$2a$10$vHOo4zsHFxMiwL37cv/xqeh5ztnYaqTVPzPiOiMZ.evo1iVrIRRuW','docente','8005375','70372572',NULL,'2026-04-19 20:30:49'),(75,'Dunia','Soliz','progra@unicen.edu.bo','$2a$10$RUE/k3pufLWTZ3fRpQQxwexlRiQCIBH5wX6vT7jwMDv67FMcpMvKq','docente','12345','70726817',NULL,'2026-04-19 20:32:20'),(76,'Sergio ','Balderrama Guzmán','emprendimiento@unicen.edu.bo','$2a$10$6FlGJ.pzjTepqDIpThAn5.k1HMur5ACs1AvZ8mTCsBExZJT1is4..','docente','6456053 ','72710005',NULL,'2026-04-19 20:33:24'),(77,'Irasid Carola','Nuñez Quiroga','est@unicen.edu.bo','$2a$10$mIIbuLHkN34a77Avz48VOOxXJHS2o94zSuifeKhdLMsc8Zlxc8wIa','docente','13456','71732320',NULL,'2026-04-19 20:41:46'),(78,'Rafael','Mejia','analisis@unicen.edu.bo','$2a$10$lvllHMdxvCf.KqCA/.FjHOW/UiEqJAk8VmKW2Slu6bQWIpbJsNt1a','docente','123456','71431922',NULL,'2026-04-19 20:43:04'),(79,'tasajosbo','azcarraga','oazcarraga@gmail.com','$2a$10$4sucaNzrdr30EZHKgeskjuo.1GphsPJLmr5Xz9Xmnu708.GR00u36','admin','4947021','70776212',NULL,'2026-04-28 09:54:33');
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

-- Dump completed on 2026-04-28  7:13:47
