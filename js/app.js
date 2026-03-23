<!-- MODAL CREATE (CORRETO) -->
<div class="modalbg" id="createModal">
  <div class="modal">

    <div style="display:flex;justify-content:space-between;align-items:center">
      <h3>Create Battle</h3>
      <button class="btn soft" data-close="createModal">Close</button>
    </div>

    <div id="createSuccess" class="success">
      <strong>Battle created on-chain.</strong>
      <div>Your battle is now live in the feed.</div>
      <button class="btn primary" data-close="createModal">Close</button>
    </div>

    <div id="createForm">

      <div class="field">
        <label>Battle title</label>
        <input id="title" placeholder="Which is better?">
      </div>

      <div class="field">
        <label>Description</label>
        <textarea id="desc"></textarea>
      </div>

      <div class="field">
        <label>Categories</label>
        <div class="chips" id="createCats"></div>
      </div>

      <!-- COMPETITOR A -->
      <div class="upload">
        <input id="labelA" placeholder="Competitor A">
        <div class="drop" id="dropA">
          Upload image A
          <input type="file" id="fileA" class="hidden">
        </div>
      </div>

      <!-- COMPETITOR B -->
      <div class="upload">
        <input id="labelB" placeholder="Competitor B">
        <div class="drop" id="dropB">
          Upload image B
          <input type="file" id="fileB" class="hidden">
        </div>
      </div>

      <!-- SLIDER -->
      <div class="field">
        <div style="display:flex;justify-content:space-between">
          <span id="daysLabel">1 day</span>
          <span id="daysCost">$1</span>
        </div>

        <input type="range" id="days" min="1" max="7" value="1">
      </div>

      <div class="center">
        <button class="btn primary" id="createBtn">
          Create on-chain
        </button>
      </div>

    </div>

  </div>
</div>
