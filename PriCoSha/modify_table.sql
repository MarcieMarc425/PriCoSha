ALTER TABLE tag
ADD is_ignored BOOLEAN NOT NULL DEFAULT 0;

CREATE TABLE Blacklist(
username_blocker VARCHAR (50) NOT NULL,
username_blocked VARCHAR (50) NOT NULL,	
PRIMARY KEY (username_blocker, username_blocked),
FOREIGN KEY (username_blocker) REFERENCES Person(username),
FOREIGN KEY (username_blocked) REFERENCES Person(username)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;