DELETE FROM user_tasks
 WHERE user_id = '037d7614-a7c4-4f42-a358-3b435c2dc1d9'
   AND (source_routine_id = 'f1ee3274-6e9d-4cbe-a5d7-69ac81e71643'
        OR (pro_link_type = 'routine' AND pro_link_value = 'f1ee3274-6e9d-4cbe-a5d7-69ac81e71643'));

DELETE FROM user_routines_bank
 WHERE routine_id = 'f1ee3274-6e9d-4cbe-a5d7-69ac81e71643'
   AND user_id = '037d7614-a7c4-4f42-a358-3b435c2dc1d9';