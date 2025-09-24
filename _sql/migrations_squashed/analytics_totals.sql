-- noinspection SqlDialectInspectionForFile
-- noinspection SqlNoDataSourceInspectionForFile
-- noinspection SqlResolveForFile

CREATE TABLE analytics_totals (
  -- Not used for anything except replication.
  id BIGINT(20) NOT NULL AUTO_INCREMENT,

  -- If we host multiple sites with distinct categories, this will enable us to
  -- segregate analytics.
  app_namespace VARCHAR(32) NOT NULL,

  -- Who sent the event.
  user_token VARCHAR(32) NOT NULL,

  -- Incrementing count of events.
  event_count BIGINT UNSIGNED NOT NULL DEFAULT 0,

  -- ========== RECORD TIMESTAMPS ==========

  first_event_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_event_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- ========== INDICES ==========
  PRIMARY KEY (id),
  UNIQUE KEY (app_namespace, user_token), -- For now
  INDEX idx_last_event_at (last_event_at)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
