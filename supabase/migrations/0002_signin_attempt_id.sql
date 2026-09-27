-- Each sign-in attempt is written down before the code is checked, and forgotten if the code
-- was right. To forget one attempt it needs an id of its own.
alter table signin_failures add column id integer generated always as identity primary key;
