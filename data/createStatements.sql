Create TABLE tblStages(
	stageID int auto_increment,
    stageName varchar(25),
    primary key(stageID)
);

Create TABLE tblcharacters(
	characterID int auto_increment,
    characterName varchar(25),
    primary key(characterID)
);

CREATE TABLE tblUsers(
	userID varchar(36),
    password varchar(64),
    email varchar(64),
    primary key (userID)
);

Create TABLE tblSessions(
   sessionID varchar(36),
   user varchar(36),
   start datetime,
   end datetime,
   primary key (sessionID),
   foreign key(user) references tblUsers(userID)
   );
   
   Create TABLE tblVods(
   vodID varchar(36),
   user varchar(36),
   opponent varchar(36),
   link text,
   note text,
   primary key (vodID),
   foreign key(user) references tblUsers(userID)
  
   );
   
   Create TABLE tblSets(
   setID varchar(36),
   protag varchar(36),
   opponent varchar(36),
   date datetime,
   primary key (setID),
   foreign key(protag) references tblUsers(userID)
    
   );
   
Create TABLE tblMatches(
   matchID varchar(36),
   setID varchar(36),
   user varchar(36),
   opChar int,
   antChar int,
   stage int,
   win bool,
   primary key (matchID),
      foreign key(setID) references tblSets(setID),
   foreign key(opChar) references tblCharacters(characterID),
	foreign key(antChar) references tblCharacters(characterID),
       foreign key(stage) references tblStages(stageID),
       foreign key (user) references tblUsers(userID)
   );

   
   
 
   
	

