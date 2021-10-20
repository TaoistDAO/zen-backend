

// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity 0.7.5;

import "./CustomBond.sol";
import "./CustomTreasury.sol";
import "../interfaces/IFactoryStorage.sol";

contract Factory {
    
    address immutable public TREASURY;
    address immutable public FACTORY_STORAGE;
    address immutable public SUBSIDY_ROUTER;
    address immutable public DAO;
    
    constructor(
        address _treasury, 
        address _factoryStorage, 
        address _subsidyRouter, 
        address _dao
    ) {
        require(_treasury != address(0), "Factory: treasury must not be zero address");
        TREASURY = _treasury;
        require(_factoryStorage != address(0), "Factory: factoryStorage must not be zero address");
        FACTORY_STORAGE = _factoryStorage;
        require(_subsidyRouter != address(0), "Factory: subsidyRouter must not be zero address");
        SUBSIDY_ROUTER = _subsidyRouter;
        require(_dao != address(0), "Factory: dao must not be zero address");
        DAO = _dao;
    }
    
    /* ======== POLICY FUNCTIONS ======== */
    
    /**
        @notice deploys custom treasury and custom bond contracts and returns address of both
        @param _payoutToken address
        @param _principleToken address
        @return _treasury address
        @return _bond address
     */
    function createBondAndTreasury(
        address _payoutToken, 
        address _principleToken, 
        uint[] calldata _tierCeilings, 
        uint[] calldata _fees
    ) external returns(address _treasury, address _bond) {    
        CustomTreasury customTreasury = new CustomTreasury(_payoutToken);
        CustomBond customBond = new CustomBond(
            address(customTreasury), 
            _payoutToken, 
            _principleToken, 
            TREASURY, 
            SUBSIDY_ROUTER, 
            DAO, 
            _tierCeilings, 
            _fees
        );
        
        return IFactoryStorage(FACTORY_STORAGE).pushBond(
            _payoutToken, 
            _principleToken, 
            address(customTreasury), 
            address(customBond), 
            _tierCeilings, 
            _fees
        );
    }

    /**
        @notice deploys custom treasury and custom bond contracts and returns address of both
        @param _payoutToken address
        @param _principleToken address
        @param _customTreasury address
        @return _treasury address
        @return _bond address
     */
    function createBond(
        address _payoutToken, 
        address _principleToken, 
        address _customTreasury, 
        uint[] calldata _tierCeilings, 
        uint[] calldata _fees 
    ) external returns(address _treasury, address _bond) {
        CustomBond bond = new CustomBond(
            _customTreasury, 
            _payoutToken, 
            _principleToken, 
            _customTreasury, 
            SUBSIDY_ROUTER, 
            DAO, 
            _tierCeilings, 
            _fees
        );

        return IFactoryStorage(FACTORY_STORAGE).pushBond(
            _payoutToken, 
            _principleToken,
            _customTreasury, 
            address(bond), 
            _tierCeilings, 
            _fees
        );
    }
    
}