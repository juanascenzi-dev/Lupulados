insert into public.business_profiles (id, business_name, address, opening_hours, email, pricing_status, price_disclaimer, active)
values ('lupulados-public-profile', 'Lupulados', 'Primera Junta 2614', 'Atención las 24 horas, todos los días.', null, 'estimated', 'Los precios son estimativos y están sujetos a confirmación.', true)
on conflict (id) do update set business_name = excluded.business_name, address = excluded.address, opening_hours = excluded.opening_hours, email = excluded.email, pricing_status = excluded.pricing_status, price_disclaimer = excluded.price_disclaimer, active = excluded.active;

insert into public.whatsapp_channels (id, label, phone_display, phone_e164, purpose, is_primary, active, sort_order)
values
  ('whatsapp-principal', 'WhatsApp principal', '11 3397-1210', '5491133971210', 'orders_and_contact', true, true, 10),
  ('whatsapp-alternativo', 'WhatsApp alternativo', '11 6546-0294', '5491165460294', 'contact', false, true, 20)
on conflict (id) do update set label = excluded.label, phone_display = excluded.phone_display, phone_e164 = excluded.phone_e164, purpose = excluded.purpose, is_primary = excluded.is_primary, active = excluded.active, sort_order = excluded.sort_order;

insert into public.products (id, slug, name, description, style, category, image_url, status, sort_order, abv, ibu, badge)
values
  ('blonde-ale', 'blonde-ale', 'Blonde Ale', 'Suave, refrescante, ideal para los que arrancan en la artesanal.', 'Blonde Ale', 'beer', 'https://images.unsplash.com/photo-1566633806327-68e152aaf26d?w=600&h=400&fit=crop', 'active', 10, 4.8, 15, 'Suave'),
  ('apa', 'apa', 'American Pale Ale (APA)', 'Cítrica y lupulada, con amargor presente y final fácil.', 'American Pale Ale', 'beer', 'https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=600&h=400&fit=crop', 'active', 20, 5.2, 35, 'Cítrica'),
  ('ipa', 'ipa', 'IPA', 'Intensa, aromática, para los que les gusta el lúpulo.', 'IPA', 'beer', 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=600&h=400&fit=crop', 'active', 30, 6.5, 55, 'Lupulada'),
  ('red-ale', 'red-ale', 'Red Ale / Amber', 'Maltosa, caramelo, equilibrada.', 'Red Ale / Amber', 'beer', 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=600&h=400&fit=crop', 'active', 40, 5, 25, 'Maltosa'),
  ('stout', 'stout', 'Stout', 'Oscura, con notas de café y chocolate.', 'Stout', 'beer', 'https://images.unsplash.com/photo-1532634922-8fe0b757fb13?w=600&h=400&fit=crop', 'active', 50, 5.8, 30, 'Oscura'),
  ('honey-wheat', 'honey-wheat', 'Honey / Wheat', 'Dulce, suave y fácil de tomar.', 'Honey / Wheat', 'beer', 'https://images.unsplash.com/photo-1571613316887-6f8d5cbf7ef7?w=600&h=400&fit=crop', 'active', 60, 4.5, 12, 'Suave'),
  ('session-ipa', 'session-ipa', 'Session IPA', 'Lupulada pero liviana, para tomar toda la noche.', 'Session IPA', 'beer', 'https://images.unsplash.com/photo-1436076863939-06870fe779c2?w=600&h=400&fit=crop', 'active', 70, 4.2, 40, 'Liviana'),
  ('scotch-ale', 'scotch-ale', 'Scotch Ale', 'Fuerte, maltosa y de cuerpo pleno.', 'Scotch Ale', 'beer', 'https://images.unsplash.com/photo-1504502350688-00f5d59bbdeb?w=600&h=400&fit=crop', 'active', 80, 7.5, 20, 'Intensa')
on conflict (id) do update set slug = excluded.slug, name = excluded.name, description = excluded.description, style = excluded.style, category = excluded.category, image_url = excluded.image_url, status = excluded.status, sort_order = excluded.sort_order, abv = excluded.abv, ibu = excluded.ibu, badge = excluded.badge;

insert into public.product_presentations (id, product_id, presentation_type, label, volume_liters, unit_price, status, sort_order, category, description)
values
  ('blonde-ale:barril20L','blonde-ale','barril20L','Barril 20L',20,38000,'active',10,'barril','Aprox 40 pintas · hasta 50 personas'),
  ('blonde-ale:barril30L','blonde-ale','barril30L','Barril 30L',30,54000,'active',20,'barril','Aprox 60 pintas · hasta 80 personas'),
  ('blonde-ale:barril50L','blonde-ale','barril50L','Barril 50L',50,85000,'active',30,'barril','Aprox 100 pintas · +100 personas'),
  ('blonde-ale:growler1L','blonde-ale','growler1L','Growler 1L',1,3200,'active',40,'growler',null),
  ('blonde-ale:growler2L','blonde-ale','growler2L','Growler 2L',2,5800,'active',50,'growler',null),
  ('blonde-ale:porron500ml','blonde-ale','porron500ml','Porrón 500ml',0.5,1800,'active',60,'porrón',null),
  ('apa:barril20L','apa','barril20L','Barril 20L',20,42000,'active',10,'barril','Aprox 40 pintas · hasta 50 personas'),
  ('apa:barril30L','apa','barril30L','Barril 30L',30,60000,'active',20,'barril','Aprox 60 pintas · hasta 80 personas'),
  ('apa:barril50L','apa','barril50L','Barril 50L',50,95000,'active',30,'barril','Aprox 100 pintas · +100 personas'),
  ('apa:growler1L','apa','growler1L','Growler 1L',1,3600,'active',40,'growler',null),
  ('apa:growler2L','apa','growler2L','Growler 2L',2,6500,'active',50,'growler',null),
  ('apa:porron500ml','apa','porron500ml','Porrón 500ml',0.5,2000,'active',60,'porrón',null),
  ('ipa:barril20L','ipa','barril20L','Barril 20L',20,46000,'active',10,'barril','Aprox 40 pintas · hasta 50 personas'),
  ('ipa:barril30L','ipa','barril30L','Barril 30L',30,66000,'active',20,'barril','Aprox 60 pintas · hasta 80 personas'),
  ('ipa:barril50L','ipa','barril50L','Barril 50L',50,105000,'active',30,'barril','Aprox 100 pintas · +100 personas'),
  ('ipa:growler1L','ipa','growler1L','Growler 1L',1,4000,'active',40,'growler',null),
  ('ipa:growler2L','ipa','growler2L','Growler 2L',2,7200,'active',50,'growler',null),
  ('ipa:porron500ml','ipa','porron500ml','Porrón 500ml',0.5,2200,'active',60,'porrón',null),
  ('red-ale:barril20L','red-ale','barril20L','Barril 20L',20,40000,'active',10,'barril','Aprox 40 pintas · hasta 50 personas'),
  ('red-ale:barril30L','red-ale','barril30L','Barril 30L',30,57000,'active',20,'barril','Aprox 60 pintas · hasta 80 personas'),
  ('red-ale:barril50L','red-ale','barril50L','Barril 50L',50,90000,'active',30,'barril','Aprox 100 pintas · +100 personas'),
  ('red-ale:growler1L','red-ale','growler1L','Growler 1L',1,3400,'active',40,'growler',null),
  ('red-ale:growler2L','red-ale','growler2L','Growler 2L',2,6200,'active',50,'growler',null),
  ('red-ale:porron500ml','red-ale','porron500ml','Porrón 500ml',0.5,1900,'active',60,'porrón',null),
  ('stout:barril20L','stout','barril20L','Barril 20L',20,44000,'active',10,'barril','Aprox 40 pintas · hasta 50 personas'),
  ('stout:barril30L','stout','barril30L','Barril 30L',30,63000,'active',20,'barril','Aprox 60 pintas · hasta 80 personas'),
  ('stout:barril50L','stout','barril50L','Barril 50L',50,100000,'active',30,'barril','Aprox 100 pintas · +100 personas'),
  ('stout:growler1L','stout','growler1L','Growler 1L',1,3800,'active',40,'growler',null),
  ('stout:growler2L','stout','growler2L','Growler 2L',2,6800,'active',50,'growler',null),
  ('stout:porron500ml','stout','porron500ml','Porrón 500ml',0.5,2100,'active',60,'porrón',null),
  ('honey-wheat:barril20L','honey-wheat','barril20L','Barril 20L',20,40000,'active',10,'barril','Aprox 40 pintas · hasta 50 personas'),
  ('honey-wheat:barril30L','honey-wheat','barril30L','Barril 30L',30,57000,'active',20,'barril','Aprox 60 pintas · hasta 80 personas'),
  ('honey-wheat:barril50L','honey-wheat','barril50L','Barril 50L',50,90000,'active',30,'barril','Aprox 100 pintas · +100 personas'),
  ('honey-wheat:growler1L','honey-wheat','growler1L','Growler 1L',1,3400,'active',40,'growler',null),
  ('honey-wheat:growler2L','honey-wheat','growler2L','Growler 2L',2,6200,'active',50,'growler',null),
  ('honey-wheat:porron500ml','honey-wheat','porron500ml','Porrón 500ml',0.5,1900,'active',60,'porrón',null),
  ('session-ipa:barril20L','session-ipa','barril20L','Barril 20L',20,42000,'active',10,'barril','Aprox 40 pintas · hasta 50 personas'),
  ('session-ipa:barril30L','session-ipa','barril30L','Barril 30L',30,60000,'active',20,'barril','Aprox 60 pintas · hasta 80 personas'),
  ('session-ipa:barril50L','session-ipa','barril50L','Barril 50L',50,95000,'active',30,'barril','Aprox 100 pintas · +100 personas'),
  ('session-ipa:growler1L','session-ipa','growler1L','Growler 1L',1,3600,'active',40,'growler',null),
  ('session-ipa:growler2L','session-ipa','growler2L','Growler 2L',2,6500,'active',50,'growler',null),
  ('session-ipa:porron500ml','session-ipa','porron500ml','Porrón 500ml',0.5,2000,'active',60,'porrón',null),
  ('scotch-ale:barril20L','scotch-ale','barril20L','Barril 20L',20,48000,'active',10,'barril','Aprox 40 pintas · hasta 50 personas'),
  ('scotch-ale:barril30L','scotch-ale','barril30L','Barril 30L',30,69000,'active',20,'barril','Aprox 60 pintas · hasta 80 personas'),
  ('scotch-ale:barril50L','scotch-ale','barril50L','Barril 50L',50,110000,'active',30,'barril','Aprox 100 pintas · +100 personas'),
  ('scotch-ale:growler1L','scotch-ale','growler1L','Growler 1L',1,4400,'active',40,'growler',null),
  ('scotch-ale:growler2L','scotch-ale','growler2L','Growler 2L',2,7800,'active',50,'growler',null),
  ('scotch-ale:porron500ml','scotch-ale','porron500ml','Porrón 500ml',0.5,2400,'active',60,'porrón',null)
on conflict (id) do update set product_id = excluded.product_id, presentation_type = excluded.presentation_type, label = excluded.label, volume_liters = excluded.volume_liters, unit_price = excluded.unit_price, status = excluded.status, sort_order = excluded.sort_order, category = excluded.category, description = excluded.description;

insert into public.delivery_options (id, label, description, price, requires_address, active, sort_order)
values
  ('fabrica', 'Retiro en fábrica', 'Coordinamos punto y horario · Gratis', 0, false, true, 10),
  ('norte', 'Zona Norte GBA', 'Zona Norte GBA', 8000, true, true, 20),
  ('caba', 'CABA / Zona Sur', 'CABA / Zona Sur', 12000, true, true, 30)
on conflict (id) do update set label = excluded.label, description = excluded.description, price = excluded.price, requires_address = excluded.requires_address, active = excluded.active, sort_order = excluded.sort_order;

insert into public.extra_options (id, label, price, unit, active, sort_order)
values
  ('chopera', 'Alquiler de chopera', 15000, 'unidad', true, 10),
  ('hielo', 'Hielo', 3000, 'bolsa', true, 20),
  ('vasos', 'Vasos', 800, 'unidad', true, 30)
on conflict (id) do update set label = excluded.label, price = excluded.price, unit = excluded.unit, active = excluded.active, sort_order = excluded.sort_order;

insert into public.promotions (id, code, promotion_type, value, active, starts_at, ends_at)
values ('primerabirra', 'PRIMERABIRRA', 'percentage', 0.1, true, null, null)
on conflict (id) do update set code = excluded.code, promotion_type = excluded.promotion_type, value = excluded.value, active = excluded.active, starts_at = excluded.starts_at, ends_at = excluded.ends_at;
