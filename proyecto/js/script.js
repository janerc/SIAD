// =====================================================
        // SIAD-GREEN SIMULADOR EN TIEMPO REAL
        // =====================================================
        
        const CONFIG = { levels: 5, columns: 6 };
        
        const productsDB = [
            { id: 1, name: "☀️ Panel Solar 300W", category: "solar", size: "xl", level: 4, column: 2, weight: 18 },
            { id: 2, name: "🔋 Inversor Solar 5kW", category: "solar", size: "large", level: 4, column: 3, weight: 12 },
            { id: 3, name: "🔧 Taladro percutor", category: "herramientas", size: "medium", level: 3, column: 1, weight: 2.5 },
            { id: 4, name: "🔨 Martillo", category: "herramientas", size: "small", level: 2, column: 0, weight: 0.8 },
            { id: 5, name: "🔋 Batería Litio 48V", category: "solar", size: "medium", level: 4, column: 4, weight: 25 },
            { id: 6, name: "🧤 Guantes seguridad", category: "seguridad", size: "small", level: 1, column: 0, weight: 0.2 },
            { id: 7, name: "📦 Controlador MPPT", category: "solar", size: "small", level: 3, column: 5, weight: 1.5 },
            { id: 8, name: "⚡ Cable Solar 50m", category: "solar", size: "large", level: 2, column: 4, weight: 5 }
        ];
        
        let lockers = [];
        let selectedProduct = null;
        let isMoving = false;
        let animationFrame = null;
        
        const sizeClass = { small: "size-small", medium: "size-medium", large: "size-large", xl: "size-xl" };
        
        // Inicializar sistema
        function initSystem() {
            for (let level = CONFIG.levels - 1; level >= 0; level--) {
                for (let col = 0; col < CONFIG.columns; col++) {
                    lockers.push({ 
                        id: `L${level}-${col}`, 
                        level, 
                        column: col, 
                        occupied: false, 
                        product: null,
                        isMoving: false
                    });
                }
            }
            
            productsDB.forEach(product => {
                const locker = lockers.find(l => l.level === product.level && l.column === product.column);
                if (locker) { 
                    locker.occupied = true; 
                    locker.product = { ...product }; 
                }
            });
            
            renderWarehouse();
            renderProductsList();
            startEnergySimulation();
        }
        
        // Renderizar almacén con animaciones
        function renderWarehouse() {
            const container = document.getElementById('rackVisualization');
            container.innerHTML = '';
            
            for (let col = 0; col < CONFIG.columns; col++) {
                const columnDiv = document.createElement('div');
                columnDiv.className = 'rack-column';
                columnDiv.style.position = 'relative';
                
                for (let level = CONFIG.levels - 1; level >= 0; level--) {
                    const locker = lockers.find(l => l.level === level && l.column === col);
                    const lockerDiv = document.createElement('div');
                    
                    let size = "size-medium";
                    if (locker?.product) size = sizeClass[locker.product.size] || "size-medium";
                    lockerDiv.className = `locker ${size}`;
                    
                    if (locker?.occupied) lockerDiv.classList.add('occupied');
                    if (!locker?.occupied) lockerDiv.classList.add('empty-locker');
                    if (locker?.isMoving) lockerDiv.classList.add('moving');
                    if (selectedProduct && selectedProduct.column === col && selectedProduct.level === level) {
                        lockerDiv.classList.add('selected');
                    }
                    
                    lockerDiv.onclick = () => selectProductByPosition(level, col);
                    
                    if (locker?.product) {
                        lockerDiv.innerHTML = `
                            <div class="locker-content">${locker.product.name.substring(0, 12)}</div>
                            <div class="locker-size-indicator">${locker.product.size.toUpperCase()}</div>
                        `;
                    } else {
                        lockerDiv.innerHTML = `<div class="locker-content">Vacío</div>`;
                    }
                    
                    columnDiv.appendChild(lockerDiv);
                }
                container.appendChild(columnDiv);
            }
        }
        
        // Renderizar lista de productos
        function renderProductsList(filter = '') {
            const container = document.getElementById('productsList');
            let filtered = productsDB;
            if (filter) filtered = productsDB.filter(p => p.name.toLowerCase().includes(filter.toLowerCase()));
            
            container.innerHTML = filtered.map(p => `
                <div class="product-card" onclick="selectProduct(${p.id})">
                    <div class="product-name">${p.name}</div>
                    <div class="product-details" style="font-size: 11px; color: #94a3b8;">
                        📐 ${p.size.toUpperCase()} | 📍 Nivel ${p.level+1}, Col ${p.column+1} | ⚡ ${p.weight}kg
                    </div>
                </div>
            `).join('');
        }
        
        // Seleccionar producto por ID
        function selectProduct(id) {
            if (isMoving) {
                addMovementLog("⏳ Sistema ocupado, espere...", "warning");
                return;
            }
            
            const product = productsDB.find(p => p.id === id);
            if (product) {
                selectedProduct = product;
                document.getElementById('selectedProductPanel').style.display = 'block';
                document.getElementById('selectedInfo').innerHTML = `
                    <div><strong>${product.name}</strong></div>
                    <div style="font-size: 12px;">📍 Ubicación: Nivel ${product.level+1} | Columna ${product.column+1}</div>
                    <div style="font-size: 12px;">📦 Tamaño: ${product.size.toUpperCase()} | Peso: ${product.weight}kg</div>
                    <div style="font-size: 12px; color: #fbbf24; margin-top: 5px;">⚡ Movimiento con Energía Solar</div>
                `;
                renderWarehouse();
                
                // Limpiar timeline
                const timeline = document.getElementById('movementSimulation');
                timeline.innerHTML = '<div class="movement-step">✅ Producto seleccionado. Presiona "Traer producto" para iniciar el movimiento.</div>';
            }
        }
        
        // Seleccionar producto por posición
        function selectProductByPosition(level, col) {
            if (isMoving) return;
            const locker = lockers.find(l => l.level === level && l.column === col);
            if (locker?.product) selectProduct(locker.product.id);
        }
        
        // Añadir mensaje al timeline
        function addMovementLog(message, type = 'active') {
            const timeline = document.getElementById('movementSimulation');
            const stepDiv = document.createElement('div');
            stepDiv.className = `movement-step ${type}`;
            stepDiv.innerHTML = message;
            timeline.appendChild(stepDiv);
            timeline.scrollTop = timeline.scrollHeight;
        }
        
        // Simular movimiento en tiempo real
        async function executeMovement() {
            if (!selectedProduct) {
                addMovementLog("❌ No hay producto seleccionado", "completed");
                return;
            }
            
            if (isMoving) {
                addMovementLog("⏳ Ya hay un movimiento en curso", "warning");
                return;
            }
            
            isMoving = true;
            const executeBtn = document.getElementById('executeBtn');
            executeBtn.disabled = true;
            
            const timeline = document.getElementById('movementSimulation');
            timeline.innerHTML = '';
            
            // Obtener locker actual
            const currentLocker = lockers.find(l => l.level === selectedProduct.level && l.column === selectedProduct.column);
            if (!currentLocker) {
                addMovementLog("❌ Error: Producto no encontrado", "completed");
                isMoving = false;
                executeBtn.disabled = false;
                return;
            }
            
            // Marcar locker en movimiento
            currentLocker.isMoving = true;
            renderWarehouse();
            
            // Simular movimiento paso a paso
            const steps = [
                { msg: "🔍 Localizando locker en posición...", delay: 500 },
                { msg: `📍 Locker encontrado en Nivel ${selectedProduct.level + 1}, Columna ${selectedProduct.column + 1}`, delay: 600 },
                { msg: "☀️ Verificando disponibilidad de energía solar...", delay: 500 },
                { msg: "✅ Energía solar disponible: 3,250W", delay: 500 },
                { msg: "🔄 Calculando ruta óptima con algoritmo A*...", delay: 700 },
                { msg: `⬅️ Movimiento horizontal: desplazamiento a columna de entrega (${selectedProduct.column + 1} → 1)`, delay: 800 },
                { msg: "⚙️ Activando motores paso a paso en rieles horizontales...", delay: 600 },
                { msg: `⬇️ Descenso vertical desde nivel ${selectedProduct.level + 1} hasta nivel 1`, delay: 800 },
                { msg: "🔋 Sistema de frenos regenerativos activado - Recuperación energética +40%", delay: 700 },
                { msg: "📍 Posicionamiento preciso en área de entrega...", delay: 600 },
                { msg: "🔓 Desbloqueo de puerta electrónica", delay: 500 },
                { msg: "📦 Producto disponible en área de entrega", delay: 500 }
            ];
            
            for (let i = 0; i < steps.length; i++) {
                addMovementLog(steps[i].msg, i === steps.length - 1 ? "completed" : "active");
                await new Promise(r => setTimeout(r, steps[i].delay));
            }
            
            // Mostrar área de entrega
            const deliveryArea = document.getElementById('deliveryArea');
            deliveryArea.style.display = 'block';
            deliveryArea.innerHTML = `🚚 PRODUCTO ENTREGADO: ${selectedProduct.name} - ¡Retire su producto!`;
            
            // Animación de parpadeo
            deliveryArea.style.animation = 'none';
            deliveryArea.offsetHeight;
            deliveryArea.style.animation = 'fadeIn 0.5s';
            
            // Actualizar estadísticas
            updateStatsAfterMovement();
            
            // Eliminar producto del locker
            currentLocker.occupied = false;
            currentLocker.product = null;
            currentLocker.isMoving = false;
            
            // Remover el producto de la base de datos para que no aparezca como disponible
            const productIndex = productsDB.findIndex(p => p.id === selectedProduct.id);
            if (productIndex !== -1) {
                productsDB.splice(productIndex, 1);
            }
            
            renderWarehouse();
            renderProductsList();
            
            addMovementLog("✅ Movimiento completado con energía solar - Cero emisiones de CO₂", "completed");
            addMovementLog("🔄 El sistema se está reorganizando para la siguiente operación...", "active");
            
            await new Promise(r => setTimeout(r, 1500));
            
            // Ocultar área de entrega después de 3 segundos
            setTimeout(() => {
                deliveryArea.style.display = 'none';
            }, 3000);
            
            isMoving = false;
            executeBtn.disabled = false;
            clearSelection();
        }
        
        // Actualizar estadísticas después del movimiento
        function updateStatsAfterMovement() {
            const recoveredElement = document.getElementById('recoveredEnergy');
            const co2Element = document.getElementById('co2Saved');
            
            if (recoveredElement) {
                let currentRecovered = parseInt(recoveredElement.innerText);
                currentRecovered += Math.floor(Math.random() * 50) + 30;
                recoveredElement.innerText = currentRecovered;
            }
            
            if (co2Element) {
                let currentCO2 = parseInt(co2Element.innerText);
                currentCO2 += Math.floor(Math.random() * 3) + 2;
                co2Element.innerText = currentCO2;
            }
        }
        
        // Limpiar selección
        function clearSelection() {
            if (isMoving) return;
            selectedProduct = null;
            document.getElementById('selectedProductPanel').style.display = 'none';
            renderWarehouse();
        }
        
        // Buscar productos
        function searchProduct() {
            const query = document.getElementById('productSearch').value;
            renderProductsList(query);
        }
        
        // Simulación de energía solar
        function startEnergySimulation() {
            setInterval(() => {
                const solarElement = document.getElementById('solarPower');
                const batteryElement = document.getElementById('batteryLevel');
                
                if (solarElement && batteryElement) {
                    const currentSolar = parseInt(solarElement.innerText);
                    const variation = Math.floor(Math.random() * 400) - 200;
                    let newSolar = currentSolar + variation;
                    newSolar = Math.min(4500, Math.max(2000, newSolar));
                    solarElement.innerText = newSolar;
                    
                    let currentBattery = parseInt(batteryElement.innerText);
                    if (newSolar > 3500 && currentBattery < 95) {
                        currentBattery = Math.min(100, currentBattery + 1);
                        batteryElement.innerText = currentBattery + '%';
                    } else if (newSolar < 2500 && currentBattery > 20 && !isMoving) {
                        currentBattery = Math.max(20, currentBattery - 0.5);
                        batteryElement.innerText = Math.floor(currentBattery) + '%';
                    }
                }
            }, 3000);
        }
        
        // Inicializar
        initSystem();