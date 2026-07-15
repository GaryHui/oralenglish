-- Run once in the Supabase SQL Editor for projects created before recording limits were added.
update storage.buckets
set file_size_limit = 2097152,
    allowed_mime_types = array['audio/webm','audio/mp4','audio/ogg']
where id = 'speaking-recordings';

-- Inspect total recording storage in MB.
select
  bucket_id,
  round(sum(coalesce((metadata->>'size')::bigint, 0)) / 1048576.0, 2) as total_mb,
  count(*) as file_count
from storage.objects
where bucket_id = 'speaking-recordings'
group by bucket_id;
