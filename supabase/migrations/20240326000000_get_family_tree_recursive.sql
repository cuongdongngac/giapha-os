-- Function to get a family tree recursively starting from a root person
-- Returns all descendants and their spouses, plus all relevant relationships

CREATE OR REPLACE FUNCTION public.get_family_tree_recursive(root_person_id UUID)
RETURNS TABLE (
    result_persons JSONB,
    result_relationships JSONB
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    descendant_ids UUID[];
    all_member_ids UUID[];
BEGIN
    -- 1. Find all descendants recursively (biological and adopted)
    WITH RECURSIVE descendants AS (
        SELECT id
        FROM public.persons
        WHERE id = root_person_id
        
        UNION
        
        SELECT p.id
        FROM public.persons p
        JOIN public.relationships r ON r.person_b = p.id
        JOIN descendants d ON r.person_a = d.id
        WHERE r.type IN ('biological_child', 'adopted_child')
    )
    SELECT ARRAY_AGG(id) INTO descendant_ids FROM descendants;

    -- 2. Find all spouses of those descendants
    WITH spouses AS (
        SELECT 
            CASE 
                WHEN person_a = ANY(descendant_ids) THEN person_b
                ELSE person_a 
            END as spouse_id
        FROM public.relationships
        WHERE type = 'marriage'
        AND (person_a = ANY(descendant_ids) OR person_b = ANY(descendant_ids))
    )
    SELECT ARRAY_AGG(DISTINCT id) INTO all_member_ids 
    FROM (
        SELECT unnest(descendant_ids) as id
        UNION
        SELECT spouse_id as id FROM spouses
    ) as combined;

    -- 3. Return the results as two JSON arrays
    RETURN QUERY
    SELECT 
        (SELECT jsonb_agg(p.*) FROM public.persons p WHERE p.id = ANY(all_member_ids)) as result_persons,
        (SELECT jsonb_agg(r.*) FROM public.relationships r 
         WHERE r.person_a = ANY(all_member_ids) AND r.person_b = ANY(all_member_ids)) as result_relationships;
END;
$$;
