-- Update size enum values to replace 6x6 with 7.5x7.5
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_size_check;

UPDATE orders
SET size = '7.5x7.5'
WHERE size = '6x6';

ALTER TABLE orders
ADD CONSTRAINT orders_size_check CHECK (size IN ('7.5x7.5', '8x8', '8x10'));
