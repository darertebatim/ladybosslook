insert into public.tags (dimension_id, slug, label, emoji, sort_order)
select d.id, v.slug, v.label, v.emoji, v.sort_order
from public.tag_dimensions d,
(values ('financial','Financial','💰',5),('business','Business','💼',6)) as v(slug,label,emoji,sort_order)
where d.slug = 'door'
on conflict do nothing;

insert into public.tag_dimensions (slug, label, emoji, sort_order, description, is_multi_select, is_active)
values ('financial_theme','Financial theme','💰',12,'Money sub-themes for the Financial door', true, true),
       ('business_theme','Business theme','💼',13,'Business sub-themes for the Business door', true, true)
on conflict do nothing;

insert into public.tags (dimension_id, slug, label, emoji, sort_order)
select d.id, v.slug, v.label, v.emoji, v.sort_order
from public.tag_dimensions d,
(values
 ('money_anxiety','Money anxiety','😰',1),
 ('budgeting','Budgeting','🧾',2),
 ('debt','Debt','💳',3),
 ('saving','Saving','🏦',4),
 ('overspending','Overspending','🛍️',5),
 ('income_growth','Grow my income','📈',6),
 ('investing','Investing basics','🌱',7),
 ('independence','Financial freedom','🕊️',8)
) as v(slug,label,emoji,sort_order)
where d.slug = 'financial_theme'
on conflict do nothing;

insert into public.tags (dimension_id, slug, label, emoji, sort_order)
select d.id, v.slug, v.label, v.emoji, v.sort_order
from public.tag_dimensions d,
(values
 ('getting_started','Getting started','🚀',1),
 ('find_clients','Finding clients','🎯',2),
 ('content_marketing','Content & marketing','📱',3),
 ('pricing_sales','Pricing & sales','🏷️',4),
 ('systems_time','Systems & time','⏳',5),
 ('founder_burnout','Founder burnout','🔥',6),
 ('confidence','Confidence & visibility','💪',7),
 ('scaling','Scaling & team','📊',8)
) as v(slug,label,emoji,sort_order)
where d.slug = 'business_theme'
on conflict do nothing;