-- Retire the legacy `releases` table. Confirmed with Sam: nothing in the
-- app UI has ever written to this table (uploads always went through the
-- `content` table via ContentUploadForm), and no manual/test data needs
-- to be preserved.

DROP TABLE `releases`;
