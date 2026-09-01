-- Existing serialized matches use superseded movement, capture, and scoring
-- rules. Player and move rows are removed through their ON DELETE CASCADE keys.
DELETE FROM "seze_game";
