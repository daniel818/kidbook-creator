-- Create generation_logs table to track AI usage and costs
create table if not exists generation_logs (
  id uuid default uuid_generate_v4() primary key,
  book_id uuid references books(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  
  -- Request Details
  step_name text, -- 'story_generation', 'character_extraction', 'illustration_page_1', etc.
  model_name text not null, -- 'gemini-3-flash-preview', 'imagen-4.0-generate-001'
  
  -- Usage metrics
  input_tokens int default 0,
  output_tokens int default 0,
  image_count int default 0,
  
  -- Calculated Cost (Populated by app logic)
  cost_usd numeric(10, 6) default 0
);

-- Add estimated_cost column to books table
alter table books add column if not exists estimated_cost numeric(10, 6) default 0;

-- Enable RLS for generation_logs (viewable by owner of the book)
alter table generation_logs enable row level security;

create policy "Users can view logs for their own books"
  on generation_logs for select
  using (
    exists (
      select 1 from books
      where books.id = generation_logs.book_id
      and books.user_id = auth.uid()
    )
  );
