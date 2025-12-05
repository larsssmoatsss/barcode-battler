import { useState, useEffect, useRef } from 'react';
import { getTypeAdvantage, getMonsterRarity } from '../engine/monsterData';
import { useItem } from '../engine/itemData';
import { removeItemByTimestamp } from '../engine/storage';
import { 
  calculateDamage, 
  checkHit, 
  getAIAction
} from '../engine/battleEngine';

// GameBoy Color Palette
const GB = {
  lightest: '#9bbc0f',
  light: '#8bac0f',
  dark: '#306230',
  darkest: '#0f380f',
};

// FIXED SIZES - BIGGER to fill the space
const SIZES = {
  spriteBox: 115,      // Square sprite boxes - BIGGER
  infoBoxWidth: 230,   // Info box width - BIGGER
  infoBoxHeight: 85,   // Info box height - BIGGER
  gap: 10,             // Gap between boxes
};

// Scrolling text - scrolls once slowly then stops
function ScrollingName({ name, maxWidth = 200, fontSize = 13 }) {
  const containerRef = useRef(null);
  const textRef = useRef(null);
  const [shouldScroll, setShouldScroll] = useState(false);
  const [animationDone, setAnimationDone] = useState(false);

  useEffect(() => {
    if (textRef.current && containerRef.current) {
      const needsScroll = textRef.current.scrollWidth > containerRef.current.clientWidth;
      setShouldScroll(needsScroll);
      setAnimationDone(false);
      
      if (needsScroll) {
        const timer = setTimeout(() => setAnimationDone(true), 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [name]);

  return (
    <div 
      ref={containerRef}
      style={{
        width: maxWidth,
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        fontSize: `${fontSize}px`,
      }}
    >
      <div
        ref={textRef}
        style={{
          display: 'inline-block',
          animation: (shouldScroll && !animationDone) ? 'scrollOnce 3s linear forwards' : 'none',
        }}
      >
        {name.toUpperCase()}
      </div>
    </div>
  );
}

export default function BattleScreen({ 
  playerTeam, 
  enemyTeam, 
  onBattleEnd,
  playerItems = [],
  onItemUsed
}) {
  const [battleState, setBattleState] = useState('INIT');
  const [currentPlayerMonster, setCurrentPlayerMonster] = useState(0);
  const [currentEnemyMonster, setCurrentEnemyMonster] = useState(0);
  const [playerMonsters, setPlayerMonsters] = useState(playerTeam);
  const [enemyMonsters, setEnemyMonsters] = useState(enemyTeam);
  const [battleLog, setBattleLog] = useState([]);
  const [menuState, setMenuState] = useState('MAIN');
  const [knockoutTracker, setKnockoutTracker] = useState({});
  const [availableItems, setAvailableItems] = useState(playerItems);
  
  // Animation states
  const [enemyShake, setEnemyShake] = useState(false);
  const [playerShake, setPlayerShake] = useState(false);
  const [enemySlash, setEnemySlash] = useState(false);
  const [playerSlash, setPlayerSlash] = useState(false);
  const battleOverRef = useRef(false);
  const logRef = useRef(null);

  const playerActive = playerMonsters[currentPlayerMonster];
  const enemyActive = enemyMonsters[currentEnemyMonster];

  // Auto-scroll log to bottom when new messages arrive
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [battleLog, battleState, menuState]);

  // Track if we've already done init
  const initDoneRef = useRef(false);

  useEffect(() => {
    if (battleState === 'INIT' && !initDoneRef.current) {
      initDoneRef.current = true;
      addLog(`Wild ${enemyActive.name} appeared!`);
      setTimeout(() => {
        if (!battleOverRef.current) {
          setBattleState('PLAYER_TURN');
        }
      }, 1500);
    }
  }, []);

  const addLog = (message) => {
    if (battleOverRef.current) return;
    // Keep full history for scrollable log
    setBattleLog(prev => [...prev, message]);
  };

  const endBattle = (winner, pMonsters, eMonsters, koTracker) => {
    battleOverRef.current = true;
    setBattleState('BATTLE_END');
    setBattleLog([winner === 'PLAYER' ? 'You won!' : 'You lost!']);
    setTimeout(() => {
      onBattleEnd({ 
        winner, 
        playerMonsters: pMonsters, 
        enemyMonsters: eMonsters,
        knockoutTracker: koTracker
      });
    }, 2000);
  };

  // ========== BATTLE LOGIC ==========
  const executePlayerAttack = () => {
    if (battleOverRef.current) return;
    setMenuState('MAIN');
    setBattleState('ANIMATING');
    
    const hit = checkHit(playerActive, enemyActive);
    
    if (!hit) {
      addLog(`${playerActive.name}'s`);
      setTimeout(() => {
        if (battleOverRef.current) return;
        addLog('attack missed!');
        setTimeout(() => {
          if (!battleOverRef.current) executeEnemyTurn();
        }, 1000);
      }, 800);
      return;
    }

    const damage = calculateDamage(playerActive, enemyActive);
    const typeAdv = getTypeAdvantage(playerActive.type, enemyActive.type);
    
    addLog(`${playerActive.name}`);
    setTimeout(() => {
      if (battleOverRef.current) return;
      addLog('attacks!');
      
      // Trigger slash and shake animations
      setEnemySlash(true);
      setTimeout(() => {
        setEnemySlash(false);
        setEnemyShake(true);
        setTimeout(() => setEnemyShake(false), 300);
      }, 150);
      
      const newEnemyMonsters = [...enemyMonsters];
      newEnemyMonsters[currentEnemyMonster] = {
        ...enemyMonsters[currentEnemyMonster],
        currentHP: Math.max(0, enemyMonsters[currentEnemyMonster].currentHP - damage)
      };
      setEnemyMonsters(newEnemyMonsters);

      setTimeout(() => {
        if (battleOverRef.current) return;
        if (typeAdv === 'ADVANTAGE') {
          addLog("Super effective!");
          setTimeout(() => checkEnemyKO(newEnemyMonsters), 1000);
        } else if (typeAdv === 'DISADVANTAGE') {
          addLog("Not effective...");
          setTimeout(() => checkEnemyKO(newEnemyMonsters), 1000);
        } else {
          checkEnemyKO(newEnemyMonsters);
        }
      }, 500);
    }, 800);
  };

  const checkEnemyKO = (newEnemyMonsters) => {
    if (battleOverRef.current) return;
    
    if (newEnemyMonsters[currentEnemyMonster].currentHP <= 0) {
      const newTracker = { ...knockoutTracker };
      const pid = playerActive.id;
      newTracker[pid] = (newTracker[pid] || 0) + 1;
      setKnockoutTracker(newTracker);
      
      addLog(`${enemyActive.name}`);
      setTimeout(() => {
        if (battleOverRef.current) return;
        addLog('fainted!');
        setTimeout(() => {
          if (battleOverRef.current) return;
          
          const nextEnemy = newEnemyMonsters.findIndex((m, i) => 
            i !== currentEnemyMonster && m.currentHP > 0
          );
          
          if (nextEnemy === -1) {
            endBattle('PLAYER', playerMonsters, newEnemyMonsters, newTracker);
          } else {
            setCurrentEnemyMonster(nextEnemy);
            addLog(`Enemy sent`);
            setTimeout(() => {
              if (battleOverRef.current) return;
              addLog(`${newEnemyMonsters[nextEnemy].name}!`);
              setTimeout(() => {
                if (!battleOverRef.current) setBattleState('PLAYER_TURN');
              }, 1000);
            }, 800);
          }
        }, 1000);
      }, 800);
    } else {
      executeEnemyTurn();
    }
  };

  const executeEnemyTurn = () => {
    if (battleOverRef.current) return;
    setBattleState('ENEMY_TURN');
    
    setTimeout(() => {
      if (battleOverRef.current) return;
      
      const currentEnemy = enemyMonsters[currentEnemyMonster];
      const currentPlayer = playerMonsters[currentPlayerMonster];
      
      const aiAction = getAIAction(
        currentEnemy, 
        currentPlayer, 
        enemyMonsters, 
        currentEnemyMonster
      );
      
      if (aiAction.type === 'SWITCH') {
        addLog(`Enemy withdrew`);
        setTimeout(() => {
          if (battleOverRef.current) return;
          addLog(`${currentEnemy.name}!`);
          setCurrentEnemyMonster(aiAction.index);
          setTimeout(() => {
            if (battleOverRef.current) return;
            addLog(`Enemy sent`);
            setTimeout(() => {
              if (battleOverRef.current) return;
              addLog(`${enemyMonsters[aiAction.index].name}!`);
              setTimeout(() => {
                if (!battleOverRef.current) setBattleState('PLAYER_TURN');
              }, 1000);
            }, 800);
          }, 800);
        }, 800);
        return;
      }
      
      const hit = checkHit(currentEnemy, currentPlayer);
      
      if (!hit) {
        addLog(`${currentEnemy.name}'s`);
        setTimeout(() => {
          if (battleOverRef.current) return;
          addLog('attack missed!');
          setTimeout(() => {
            if (!battleOverRef.current) setBattleState('PLAYER_TURN');
          }, 1000);
        }, 800);
        return;
      }

      const damage = calculateDamage(currentEnemy, currentPlayer);
      const typeAdv = getTypeAdvantage(currentEnemy.type, currentPlayer.type);
      
      addLog(`${currentEnemy.name}`);
      setTimeout(() => {
        if (battleOverRef.current) return;
        addLog('attacks!');
        
        // Trigger slash and shake animations on player
        setPlayerSlash(true);
        setTimeout(() => {
          setPlayerSlash(false);
          setPlayerShake(true);
          setTimeout(() => setPlayerShake(false), 300);
        }, 150);
        
        const newPlayerMonsters = [...playerMonsters];
        newPlayerMonsters[currentPlayerMonster] = {
          ...playerMonsters[currentPlayerMonster],
          currentHP: Math.max(0, playerMonsters[currentPlayerMonster].currentHP - damage)
        };
        setPlayerMonsters(newPlayerMonsters);

        setTimeout(() => {
          if (battleOverRef.current) return;
          if (typeAdv === 'ADVANTAGE') {
            addLog("Super effective!");
            setTimeout(() => checkPlayerKO(newPlayerMonsters), 1000);
          } else if (typeAdv === 'DISADVANTAGE') {
            addLog("Not effective...");
            setTimeout(() => checkPlayerKO(newPlayerMonsters), 1000);
          } else {
            checkPlayerKO(newPlayerMonsters);
          }
        }, 500);
      }, 800);
    }, 500);
  };

  const checkPlayerKO = (newPlayerMonsters) => {
    if (battleOverRef.current) return;
    
    if (newPlayerMonsters[currentPlayerMonster].currentHP <= 0) {
      addLog(`${playerActive.name}`);
      setTimeout(() => {
        if (battleOverRef.current) return;
        addLog('fainted!');
        setTimeout(() => {
          if (battleOverRef.current) return;
          
          const nextPlayer = newPlayerMonsters.findIndex((m, i) => 
            i !== currentPlayerMonster && m.currentHP > 0
          );
          
          if (nextPlayer === -1) {
            endBattle('ENEMY', newPlayerMonsters, enemyMonsters, knockoutTracker);
          } else {
            setMenuState('PKMN_FORCED');
            setBattleState('PLAYER_TURN');
          }
        }, 1000);
      }, 800);
    } else {
      setBattleState('PLAYER_TURN');
    }
  };

  const handleSwitch = (index) => {
    if (battleOverRef.current) return;
    const newMonster = playerMonsters[index];
    setCurrentPlayerMonster(index);
    setMenuState('MAIN');
    
    addLog(`Go! ${newMonster.name}!`);
    
    if (menuState === 'PKMN_FORCED') {
      setTimeout(() => {
        if (!battleOverRef.current) setBattleState('PLAYER_TURN');
      }, 1000);
    } else {
      setTimeout(() => {
        if (!battleOverRef.current) executeEnemyTurn();
      }, 1000);
    }
  };

  const handleUseItem = (item, itemIndex) => {
    if (battleOverRef.current) return;
    const result = useItem(item, playerActive, true);
    
    if (result.success) {
      const newPlayerMonsters = [...playerMonsters];
      newPlayerMonsters[currentPlayerMonster] = result.monster;
      setPlayerMonsters(newPlayerMonsters);
      
      const newItems = [...availableItems];
      newItems.splice(itemIndex, 1);
      setAvailableItems(newItems);
      
      removeItemByTimestamp(item.obtainedAt);
      if (onItemUsed) onItemUsed();
      
      setMenuState('MAIN');
      addLog(result.message);
      setTimeout(() => {
        if (!battleOverRef.current) executeEnemyTurn();
      }, 1000);
    } else {
      addLog(result.message);
    }
  };

  const getRarityAbbrev = (monsterId) => {
    const rarity = getMonsterRarity(monsterId);
    const abbrevs = { 'COMMON': 'C', 'UNCOMMON': 'UC', 'RARE': 'R', 'EPIC': 'E', 'LEGENDARY': 'L' };
    return abbrevs[rarity] || '?';
  };

  // ========== RENDER ==========
  return (
    <div style={{
      width: '100%',
      height: '100%',
      backgroundColor: GB.lightest,
      display: 'flex',
      flexDirection: 'column',
      fontFamily: '"Press Start 2P", monospace',
      color: GB.darkest,
      overflow: 'hidden',
    }}>
      {/* CSS for animations */}
      <style>{`
        @keyframes scrollOnce {
          0% { transform: translateX(0); }
          100% { transform: translateX(-40%); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-4px); }
          40% { transform: translateX(4px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
        @keyframes slashFlash {
          0% { opacity: 0; }
          20% { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>

      {/* ===== BATTLE SCENE - Centered both ways ===== */}
      <div style={{
        flex: '1 1 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '8px',
      }}>
        {/* Inner container with fixed layout */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '4px',
        }}>
          
          {/* ===== ENEMY ROW ===== */}
          <div style={{
            display: 'flex',
            gap: `${SIZES.gap}px`,
            alignItems: 'flex-start',
          }}>
            {/* Enemy Info Box - FIXED SIZE */}
            <div style={{
              width: `${SIZES.infoBoxWidth}px`,
              height: `${SIZES.infoBoxHeight}px`,
              border: `3px solid ${GB.darkest}`,
              backgroundColor: GB.lightest,
              padding: '8px',
              boxSizing: 'border-box',
            }}>
              <ScrollingName name={enemyActive.name} maxWidth={SIZES.infoBoxWidth - 24} fontSize={13} />
              <div style={{ fontSize: '10px', marginTop: '4px' }}>
                Lv{enemyActive.level} · {getRarityAbbrev(enemyActive.id)}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px' }}>
                <span style={{ fontSize: '10px' }}>HP</span>
                <div style={{
                  flex: 1,
                  height: '12px',
                  backgroundColor: GB.light,
                  border: `2px solid ${GB.darkest}`,
                }}>
                  <div style={{
                    width: `${Math.max(0, (enemyActive.currentHP / enemyActive.maxHP) * 100)}%`,
                    height: '100%',
                    backgroundColor: GB.dark,
                  }} />
                </div>
              </div>
            </div>

            {/* Enemy Sprite Box - SQUARE */}
            <div style={{
              width: `${SIZES.spriteBox}px`,
              height: `${SIZES.spriteBox}px`,
              border: `3px solid ${GB.darkest}`,
              backgroundColor: GB.light,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              animation: enemyShake ? 'shake 0.3s ease-in-out' : 'none',
            }}>
              <div style={{ fontSize: '55px', color: GB.darkest }}>
                {enemyActive.type === 'ARCANE' ? '◆' : 
                 enemyActive.type === 'PRIMAL' ? '▲' : '★'}
              </div>
              {/* Slash effect overlay */}
              {enemySlash && (
                <div style={{
                  position: 'absolute',
                  top: '10%',
                  left: '10%',
                  width: '80%',
                  height: '80%',
                  background: `linear-gradient(135deg, transparent 40%, ${GB.lightest} 50%, transparent 60%)`,
                  animation: 'slashFlash 0.15s ease-out',
                  pointerEvents: 'none',
                }} />
              )}
            </div>
          </div>

          {/* Enemy Team Dots */}
          <div style={{
            display: 'flex',
            gap: '4px',
            alignSelf: 'flex-start',
          }}>
            {enemyMonsters.map((m, i) => (
              <div key={i} style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: m.currentHP > 0 ? GB.darkest : GB.light,
                border: `2px solid ${GB.darkest}`,
              }} />
            ))}
          </div>

          {/* ===== DOTTED DIVIDER ===== */}
          <div style={{
            width: `${SIZES.infoBoxWidth + SIZES.spriteBox + SIZES.gap}px`,
            borderBottom: `3px dashed ${GB.darkest}`,
            margin: '2px 0',
          }} />

          {/* ===== PLAYER ROW ===== */}
          <div style={{
            display: 'flex',
            gap: `${SIZES.gap}px`,
            alignItems: 'flex-start',
          }}>
            {/* Player Sprite Box - SQUARE */}
            <div style={{
              width: `${SIZES.spriteBox}px`,
              height: `${SIZES.spriteBox}px`,
              border: `3px solid ${GB.darkest}`,
              backgroundColor: GB.light,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              animation: playerShake ? 'shake 0.3s ease-in-out' : 'none',
            }}>
              <div style={{ fontSize: '55px', color: GB.darkest }}>
                {playerActive.type === 'ARCANE' ? '◇' : 
                 playerActive.type === 'PRIMAL' ? '△' : '☆'}
              </div>
              {/* Slash effect overlay */}
              {playerSlash && (
                <div style={{
                  position: 'absolute',
                  top: '10%',
                  left: '10%',
                  width: '80%',
                  height: '80%',
                  background: `linear-gradient(135deg, transparent 40%, ${GB.lightest} 50%, transparent 60%)`,
                  animation: 'slashFlash 0.15s ease-out',
                  pointerEvents: 'none',
                }} />
              )}
            </div>

            {/* Player Info Box - FIXED SIZE */}
            <div style={{
              width: `${SIZES.infoBoxWidth}px`,
              height: `${SIZES.infoBoxHeight}px`,
              border: `3px solid ${GB.darkest}`,
              backgroundColor: GB.lightest,
              padding: '8px',
              boxSizing: 'border-box',
            }}>
              <ScrollingName name={playerActive.name} maxWidth={SIZES.infoBoxWidth - 24} fontSize={13} />
              <div style={{ fontSize: '10px', marginTop: '4px' }}>
                Lv{playerActive.level} · {getRarityAbbrev(playerActive.id)}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px' }}>
                <span style={{ fontSize: '10px' }}>HP</span>
                <div style={{
                  flex: 1,
                  height: '12px',
                  backgroundColor: GB.light,
                  border: `2px solid ${GB.darkest}`,
                }}>
                  <div style={{
                    width: `${Math.max(0, (playerActive.currentHP / playerActive.maxHP) * 100)}%`,
                    height: '100%',
                    backgroundColor: GB.dark,
                  }} />
                </div>
                <span style={{ fontSize: '9px' }}>{playerActive.currentHP}/{playerActive.maxHP}</span>
              </div>
            </div>
          </div>

          {/* Player Team Dots */}
          <div style={{
            display: 'flex',
            gap: '4px',
            alignSelf: 'flex-end',
          }}>
            {playerMonsters.map((m, i) => (
              <div key={i} style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: m.currentHP > 0 ? GB.darkest : GB.light,
                border: `2px solid ${GB.darkest}`,
              }} />
            ))}
          </div>

        </div>
      </div>

      {/* ===== TEXT BOX + MENU ===== */}
      <div style={{
        flex: '0 0 auto',
        borderTop: `4px solid ${GB.darkest}`,
      }}>
        {/* Message Area - FIXED HEIGHT, 2 lines visible, scrollable log */}
        <div 
          ref={logRef}
          style={{
            height: '48px',
            borderBottom: `3px solid ${GB.darkest}`,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Spacer to push content down when few messages */}
          <div style={{ flex: 1 }} />
          
          {/* Messages container */}
          <div style={{ padding: '0 12px' }}>
            {battleLog.map((log, i) => (
              <div key={i} style={{ 
                fontSize: '11px', 
                lineHeight: '18px',
              }}>
                {log}
              </div>
            ))}
            {battleState === 'PLAYER_TURN' && menuState === 'MAIN' && (
              <div style={{ 
                fontSize: '11px', 
                lineHeight: '18px',
              }}>
                What will {playerActive.name.length > 10 ? playerActive.name.substring(0, 10) + '..' : playerActive.name} do?
              </div>
            )}
          </div>
          
          {/* Bottom spacer for centering when few messages */}
          <div style={{ flex: 1 }} />
        </div>

        {/* Action Menu */}
        <div style={{ height: '58px', display: 'flex' }}>
          {battleState === 'PLAYER_TURN' && menuState === 'MAIN' && (
            <MainMenu 
              onFight={() => executePlayerAttack()}
              onMon={() => setMenuState('MON')}
              onItem={() => setMenuState('ITEM')}
              onRun={() => {
                // 40% base chance to escape, +10% for each speed advantage
                const playerSpeed = playerActive.baseStats.speed;
                const enemySpeed = enemyActive.baseStats.speed;
                const speedDiff = playerSpeed - enemySpeed;
                const escapeChance = 0.4 + (speedDiff * 0.05);
                
                if (Math.random() < escapeChance) {
                  addLog("Got away safely!");
                  setTimeout(() => {
                    onBattleEnd({ 
                      winner: 'FLEE', 
                      playerMonsters, 
                      enemyMonsters,
                      knockoutTracker 
                    });
                  }, 1000);
                } else {
                  addLog("Can't escape!");
                  setTimeout(() => {
                    if (!battleOverRef.current) executeEnemyTurn();
                  }, 800);
                }
              }}
            />
          )}
          {battleState === 'PLAYER_TURN' && menuState === 'MON' && (
            <MonsterMenu 
              team={playerMonsters}
              currentIndex={currentPlayerMonster}
              onSelect={handleSwitch}
              onBack={() => setMenuState('MAIN')}
            />
          )}
          {battleState === 'PLAYER_TURN' && menuState === 'PKMN_FORCED' && (
            <MonsterMenu 
              team={playerMonsters}
              currentIndex={currentPlayerMonster}
              onSelect={handleSwitch}
              onBack={() => {}}
              forced
            />
          )}
          {battleState === 'PLAYER_TURN' && menuState === 'ITEM' && (
            <ItemMenu 
              items={availableItems}
              onSelect={handleUseItem}
              onBack={() => setMenuState('MAIN')}
            />
          )}
          {(battleState === 'ANIMATING' || battleState === 'ENEMY_TURN' || battleState === 'INIT' || battleState === 'BATTLE_END') && (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {battleState !== 'INIT' && battleState !== 'BATTLE_END' && '...'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ========== MENU COMPONENTS ==========

function MainMenu({ onFight, onMon, onItem, onRun }) {
  const [selected, setSelected] = useState(0);
  const options = [
    { label: 'FIGHT', action: onFight },
    { label: 'MON', action: onMon },
    { label: 'ITEM', action: onItem },
    { label: 'RUN', action: onRun },
  ];

  return (
    <div style={{
      flex: 1,
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gridTemplateRows: '1fr 1fr',
      border: `3px solid ${GB.darkest}`,
      backgroundColor: GB.lightest,
    }}>
      {options.map((opt, i) => (
        <div
          key={opt.label}
          onClick={opt.action}
          onMouseEnter={() => setSelected(i)}
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '0 10px',
            cursor: 'pointer',
            backgroundColor: selected === i ? GB.light : 'transparent',
            borderRight: i % 2 === 0 ? `2px solid ${GB.dark}` : 'none',
            borderBottom: i < 2 ? `2px solid ${GB.dark}` : 'none',
          }}
        >
          <span style={{ width: '14px', fontSize: '11px' }}>
            {selected === i ? '▶' : ''}
          </span>
          <span style={{ fontSize: '12px' }}>{opt.label}</span>
        </div>
      ))}
    </div>
  );
}

function MonsterMenu({ team, currentIndex, onSelect, onBack, forced = false }) {
  const [selected, setSelected] = useState(0);
  const available = team.filter((m, i) => i !== currentIndex && m.currentHP > 0);
  
  return (
    <div style={{
      flex: 1,
      border: `3px solid ${GB.darkest}`,
      backgroundColor: GB.lightest,
      overflow: 'auto',
      padding: '4px',
    }}>
      {available.length === 0 ? (
        <div style={{ padding: '8px', fontSize: '11px' }}>No other monsters!</div>
      ) : (
        available.map((monster, i) => {
          const realIndex = team.findIndex(m => m.id === monster.id);
          return (
            <div
              key={monster.id}
              onClick={() => onSelect(realIndex)}
              onMouseEnter={() => setSelected(i)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '4px',
                cursor: 'pointer',
                backgroundColor: selected === i ? GB.light : 'transparent',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ width: '14px', fontSize: '11px' }}>{selected === i ? '▶' : ''}</span>
                <span style={{ fontSize: '11px' }}>{monster.name.substring(0, 10)}</span>
              </div>
              <span style={{ fontSize: '10px' }}>{monster.currentHP}/{monster.maxHP}</span>
            </div>
          );
        })
      )}
      {!forced && (
        <div
          onClick={onBack}
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '4px',
            cursor: 'pointer',
            borderTop: `2px solid ${GB.dark}`,
            marginTop: '2px',
          }}
        >
          <span style={{ width: '14px', fontSize: '11px' }}>◀</span>
          <span style={{ fontSize: '11px' }}>BACK</span>
        </div>
      )}
    </div>
  );
}

function ItemMenu({ items, onSelect, onBack }) {
  const [selected, setSelected] = useState(0);
  const battleItems = items.filter(item => item.usableInBattle);
  
  return (
    <div style={{
      flex: 1,
      border: `3px solid ${GB.darkest}`,
      backgroundColor: GB.lightest,
      overflow: 'auto',
      padding: '4px',
    }}>
      {battleItems.length === 0 ? (
        <div style={{ padding: '8px', fontSize: '11px' }}>No items!</div>
      ) : (
        battleItems.map((item, i) => {
          const realIndex = items.findIndex(it => it.obtainedAt === item.obtainedAt);
          return (
            <div
              key={item.obtainedAt}
              onClick={() => onSelect(item, realIndex)}
              onMouseEnter={() => setSelected(i)}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '4px',
                cursor: 'pointer',
                backgroundColor: selected === i ? GB.light : 'transparent',
              }}
            >
              <span style={{ width: '14px', fontSize: '11px' }}>{selected === i ? '▶' : ''}</span>
              <span style={{ fontSize: '11px' }}>{item.name}</span>
            </div>
          );
        })
      )}
      <div
        onClick={onBack}
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '4px',
          cursor: 'pointer',
          borderTop: `2px solid ${GB.dark}`,
          marginTop: '2px',
        }}
      >
        <span style={{ width: '14px', fontSize: '11px' }}>◀</span>
        <span style={{ fontSize: '11px' }}>BACK</span>
      </div>
    </div>
  );
}