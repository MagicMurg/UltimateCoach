const express = require('express');
const cors = require('cors')
const mysql = require('mysql')
const {v4:uuidv4} = require('uuid')


const HTTP_PORT = 8000

const connSmash = mysql.createPool({
    host:"localhost",
    user:"root",
    password:"T#30r%2023",
    database:"summersmash"
})


var app = express()
app.use(cors())
app.use(express.json())

//route to list legal stages
app.get('/', (req, res) => {
   res.json('Server is running')

})

//login route to add session
app.post('/api/login', (req, res) => {
    const strUser = req.body.user
    const strPass = req.body.pass
    const strSessionID = uuidv4()
    connSmash.query('SELECT * FROM tblUsers WHERE email = ? AND password = ?', [strUser, strPass], (err, rows) => {
        if (err) {
            console.error(err)
            res.status(500).json({error: 'No User Found'})
        } else {
            if (rows.length > 0) {
                const startTime = new Date()
                const strUserID = rows[0].userID
                connSmash.query('INSERT INTO tblSessions (sessionID, user,start) VALUES (?, ?,?)', [strSessionID, strUserID,startTime], (err, rows) => {
                    if (err) {
                        console.error(err)
                        res.status(500).json({error: 'Error creating session'})
                    } else {
                        res.json({sessionID: strSessionID})
                    }
                })
            } else {
                res.status(401).json({error: 'Invalid credentials'})
            }
        }
    })
})
//route to register a new user
app.post('/api/register', (req, res) => {
    const strUserID = uuidv4()
    const strPass = req.body.pass
    const strCheckPass = req.body.checkPass
    const strEmail = req.body.email
    const strSessionID = uuidv4()
    connSmash.query('SELECT * FROM tblUsers WHERE email = ?', [strEmail], (err, rows) => {
        if (err) {
            console.error(err)
            res.status(500).json({error: 'No User Found'})
        } else {
            if (rows.length > 0) {
                res.status(401).json({error: 'Email already in use'})
            } else {
                if (strPass === strCheckPass) {
                    connSmash.query('INSERT INTO tblUsers (userID, password,email) VALUES (?, ?,?)', [strUserID, strPass,strEmail], (err, rows) => {
                        if (err) {
                            console.error(err)
                            res.status(500).json({error: 'Error creating user'})
                        } else {
                            const startTime = new Date()
                            connSmash.query('INSERT INTO tblSessions (sessionID, user,start) VALUES (?, ?,?)', [strSessionID, strUserID,startTime], (err, rows) => {
                                if (err) {
                                    console.error(err)
                                    res.status(500).json({error: 'Error creating session'})
                                } else {
                                    res.json({sessionID: strSessionID})
                                }
                            })
                        }
                    })
                } else {
                    res.status(401).json({error: 'Passwords do not match'})
                }
            }
        }
    }
    )
})
    

//function to check if a session is valid
function checkSession(strSessionID, callback) {
    connSmash.query('SELECT user FROM tblSessions WHERE sessionID = ? and end is null', [strSessionID], (err, rows) => {
        if (err) {
            callback(err, null);
        } else if (rows.length === 0) {
            callback(null, { valid: false });
        } else {
            callback(null, { valid: true, user: rows[0].user });
        }
    });
}

//Route to return the stage,charater played, and result for each match in a users history, for home menu display
app.get('/api/matchResults', (req, res) => {
    const strSessionID = req.query.sessionID;
    checkSession(strSessionID, (err, session) => {
        if (err) {
            res.status(500).json({ error: 'Session Not Found' });
            return;
        }
        if (!session.valid) {
            res.status(401).json({ error: 'Invalid session' });
            return;
        }
        const strUser = session.user;
        connSmash.query('SELECT opchar,stage,win FROM tblMatches WHERE user = ?', [strUser], (err, rows) => {
            if (err) {
                console.error(err);
                res.status(500).json({ error: 'No User Found' });
            } else {
                res.json(rows);
            }
        });
    });
});

//return the necessary components for the vods section, videoloink, opponent and notes
app.get('/api/vods', (req, res) => {
    const strSessionID = req.query.sessionID;
    checkSession(strSessionID, (err, session) => {
        if (err) {
            res.status(500).json({ error: 'Session Not Found' });
            return;
        }
        if (!session.valid) {
            res.status(401).json({ error: 'Invalid session' });
            return;
        }
        const strUser = session.user;
        connSmash.query('SELECT opponent,link,note FROM tblVods WHERE user = ?', [strUser], (err, rows) => {
            if (err) {
                console.error(err);
                res.status(500).json({ error: 'No User Found' });
            } else {
                res.json(rows);
            }
        });
    });
});

//route to post a new vod
app.post('/api/vods', (req, res) => {
    const strSessionID = req.body.sessionID;
    checkSession(strSessionID, (err, session) => {
        if (err) {
            res.status(500).json({ error: 'Session Not Found' });
            return;
        }
        if (!session.valid) {
            res.status(401).json({ error: 'Invalid session' });
            return;
        }
        const strUser = session.user;
        const strOpponent = req.body.opponent;
        const strLink = req.body.link;
        const vodID = uuidv4();
        connSmash.query('INSERT INTO tblVods (vodID,user,opponent,link,note) VALUES (?,?,?,?," ")', [vodID,strUser,strOpponent, strLink], (err, rows) => {
            if (err) {
                console.error(err);
                res.status(500).json({ error: 'No User Found' });
            } else {
                res.json(rows);
            }
        });
    });
});

//route to write a note (since we added a space on creation, we can use a put for all entries)
app.put('/api/notes', (req, res) => {
    const strSessionID = req.body.sessionID;
    checkSession(strSessionID, (err, session) => {
        if (err) {
            res.status(500).json({ error: 'Session Not Found' });
            return;
        }
        if (!session.valid) {
            res.status(401).json({ error: 'Invalid session' });
            return;
        }
        const strUser = session.user;
        const strNote = req.body.note;
        const strLink = req.body.link;
        const strDate = new Date();
        connSmash.query('UPDATE tblVods SET note = ?, date = ? WHERE user = ? AND link = ?', [strNote,strDate,strUser, strLink], (err, rows) => {
            if (err) {
                console.error(err);
                res.status(500).json({ error: 'No User Found' });
            } else {
                res.json(rows);
            }
        });
    });
});

//route to view sets
app.get('/api/sets', (req, res) => {
    const strSessionID = req.query.sessionID;
    checkSession(strSessionID, (err, session) => {
        if (err) {
            res.status(500).json({ error: 'Session Not Found' });
            return;
        }
        if (!session.valid) {
            res.status(401).json({ error: 'Invalid session' });
            return;
        }
        const strUser = session.user;
        connSmash.query('SELECT setID, opponent, date FROM tblSets WHERE protag = ?', [strUser], (err, rows) => {
            if (err) {
                console.error(err);
                res.status(500).json({ error: 'No User Found' });
            } else {
                res.json(rows);
            }
        });
    });
});

//route to view matches of set
app.get('/api/matches', (req, res) => {
    const strSessionID = req.query.sessionID;
    const strSetID = req.query.setID;
    checkSession(strSessionID, (err, session) => {
        if (err) {
            res.status(500).json({ error: 'Session Not Found' });
            return;
        }
        if (!session.valid) {
            res.status(401).json({ error: 'Invalid session' });
            return;
        }
        const strUser = session.user;
        connSmash.query('SELECT matchID,opChar,antChar,stage,win FROM tblMatches WHERE user = ? and setID = ?', [strUser,strSetID], (err, rows) => {
            if (err) {
                console.error(err);
                res.status(500).json({ error: 'No User Found' });
            } else {
                res.json(rows);
            }
        });
    });
});

//route to add a set
app.post('/api/sets', (req, res) => {
    const strSessionID = req.body.sessionID;
    checkSession(strSessionID, (err, session) => {
        if (err) {
            res.status(500).json({ error: 'Session Not Found' });
            return;
        }
        if (!session.valid) {
            res.status(401).json({ error: 'Invalid session' });
            return;
        }
        const strSetID = uuidv4();
        const strDate = req.body.date;
        const strUser = session.user;
        const strOpponent = req.body.opponent;
        connSmash.query('INSERT INTO tblSets (setID,protag,opponent,date) VALUES (?, ?,?,?)', [strSetID,strUser,strOpponent,strDate], (err, rows) => {
            if (err) {
                console.error(err);
                res.status(500).json({ error: 'No User Found' });
            } else {
                res.json({setID: strSetID});
            }
        });
    });
});

//route to add matches to a set
app.post('/api/matches', (req, res) => {
    const strSessionID = req.body.sessionID;
    checkSession(strSessionID, (err, session) => {
        if (err) {
            res.status(500).json({ error: 'Session Not Found' });
            return;
        }
        if (!session.valid) {
            res.status(401).json({ error: 'Invalid session' });
            return;
        }
        const strMatchID = uuidv4();
        const strUser = session.user;
        const strSetID = req.body.setID;
        const strStage = req.body.stage;
        const strOPChar = req.body.opChar;
        const strAntChar = req.body.antChar;
        const strWin = req.body.win;
        connSmash.query('INSERT INTO tblMatches (matchID,user,setID,stage,win,opChar,antChar) VALUES (?, ?,?,?,?,?,?)', [strMatchID,strUser,strSetID,strStage,strWin,strOPChar,strAntChar], (err, rows) => {
            if (err) {
                console.error(err);
                res.status(500).json({ error: 'No User Found' });
            } else {
                res.json(rows);
            }
        });
    });
});

//route to retrieve notes and date from certain player
app.get('/api/playerNotes', (req, res) => {
    const strSessionID = req.query.sessionID;
    checkSession(strSessionID, (err, session) => {
        if (err) {
            res.status(500).json({ error: 'Session Not Found' });
            return;
        }
        if (!session.valid) {
            res.status(401).json({ error: 'Invalid session' });
            return;
        }
        const strUser = session.user;
        const strOpponent = req.query.opponent;
        connSmash.query('SELECT note,date FROM tblVods WHERE user = ? and opponent = ?', [strUser,strOpponent], (err, rows) => {
            if (err) {
                console.error(err);
                res.status(500).json({ error: 'No User Found' });
            } else {
                res.json(rows);
            }
        });
    });
});

//route to get matches from a player and opponent using a join between tblSets and tblMatches to limit the matches returned ( for use on single.html)
app.get('/api/playerMatches', (req, res) => {
    const strSessionID = req.query.sessionID;
    checkSession(strSessionID, (err, session) => {
        if (err) {
            res.status(500).json({ error: 'Session Not Found' });
            return;
        }
        if (!session.valid) {
            res.status(401).json({ error: 'Invalid session' });
            return;
        }
        const strUser = session.user;
        const strOpponent = req.query.opponent;
        connSmash.query('SELECT matchID,opChar,antChar,stage,win FROM tblMatches INNER JOIN tblSets ON tblMatches.setID = tblSets.setID WHERE user = ? and opponent = ?', [strUser,strOpponent], (err, rows) => {
            if (err) {
                console.error(err);
                res.status(500).json({ error: 'No User Found' });
            } else {
                res.json(rows);
            }
        });
    });
});

//logout route
app.put('/api/logout', (req, res) => {
    const strSessionID = req.body.sessionID;
    checkSession(strSessionID, (err, session) => {
        if (err) {
            res.status(500).json({ error: 'Session Not Found' });
            return;
        }
        if (!session.valid) {
            res.status(401).json({ error: 'Invalid session' });
            return;
        }
        connSmash.query('UPDATE tblSessions SET end = ? WHERE sessionID = ?', [new Date(),strSessionID], (err, rows) => {
            if (err) {
                console.error(err);
                res.status(500).json({ error: 'No User Found' });
            } else {
                res.json(rows);
            }
        });
    });
});

//route to return all stage names
app.get('/api/stages', (req, res) => {
    const strSessionID = req.query.sessionID;
    checkSession(strSessionID, (err, session) => {
        if (err) {
            res.status(500).json({ error: 'Session Not Found' });
            return;
        }
        if (!session.valid) {
            res.status(401).json({ error: 'Invalid session' });
            return;
        }
        connSmash.query('SELECT * FROM tblStages', (err, rows) => {
            if (err) {
                console.error(err);
                res.status(500).json({ error: 'No stages Found' });
            } else {
                res.json(rows);
            }
        });
    });
});

//route to return all characters

app.get('/api/characters', (req, res) => {
    const strSessionID = req.query.sessionID;
    checkSession(strSessionID, (err, session) => {
        if (err) {
            res.status(500).json({ error: 'Session Not Found' });
            return;
        }
        if (!session.valid) {
            res.status(401).json({ error: 'Invalid session' });
            return;
        }
        connSmash.query('SELECT * FROM tblCharacters', (err, rows) => {
            if (err) {
                console.error(err);
                res.status(500).json({ error: 'No characters Found' });
            } else {
                res.json(rows);
            }
        });
    });
});












app.listen(HTTP_PORT, () => {
    console.log('App listening on port', HTTP_PORT)
})
